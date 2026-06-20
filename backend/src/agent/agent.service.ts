/**
 * AgentService — Copilot SDK BYOK (Azure OpenAI) AI Agent
 *
 * Uses @github/copilot-sdk for tool definitions and openai (AzureOpenAI)
 * for actual LLM calls with Tool Calling + SSE streaming.
 *
 * Environment variables:
 *   AZURE_OPENAI_ENDPOINT  — e.g. https://xxx.openai.azure.com/
 *   AZURE_OPENAI_KEY       — Azure API key
 *   AZURE_OPENAI_DEPLOYMENT — deployment name (default: gpt-4o)
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, Subject } from 'rxjs';
import { AzureOpenAI } from 'openai';
import type {
  ChatCompletionTool,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import { TasksService } from '../tasks/tasks.service';

export interface ChatDto {
  message: string;
  date?: string;
}

export interface ChatResponse {
  response: string;
  toolCalls: ToolCallResult[];
}

export interface ToolCallResult {
  toolName: string;
  result: unknown;
}

/** SSE event shape sent to the client */
export interface SseEvent {
  type: 'token' | 'tool_call' | 'error' | 'done';
  content?: string;
  toolName?: string;
  toolResult?: unknown;
}

// ─── Tool schemas (OpenAI function calling format) ───────────────────────────

const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'createTask',
      description:
        '할 일(Todo)을 생성합니다. 날짜와 우선순위를 지정할 수 있습니다.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '할 일 제목',
          },
          date: {
            type: 'string',
            description: '날짜 (YYYY-MM-DD). 생략 시 오늘 날짜 사용.',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: '우선순위',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prioritizeTasks',
      description:
        '특정 날짜의 미완료 할 일을 우선순위 순으로 분석해 반환합니다.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: '분석할 날짜 (YYYY-MM-DD)',
          },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'decomposeTask',
      description: '복잡한 태스크를 서브태스크 목록으로 분해합니다.',
      parameters: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: '분해할 부모 태스크 ID',
          },
          subtasks: {
            type: 'array',
            items: { type: 'string' },
            description: '서브태스크 제목 배열',
          },
        },
        required: ['taskId', 'subtasks'],
      },
    },
  },
];

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `당신은 Smart Task Hub의 AI 비서입니다.
사용자가 자연어로 할 일 관리를 요청하면, 적절한 도구를 호출해 처리합니다.

사용 가능한 도구:
- createTask: 새 할 일 생성
- prioritizeTasks: 특정 날짜의 할 일 우선순위 분석
- decomposeTask: 복잡한 태스크를 서브태스크로 분해

규칙:
1. 날짜가 언급되지 않으면 오늘 날짜를 사용하세요.
2. "다음 주 월요일" 등 상대적 날짜 표현은 YYYY-MM-DD로 변환하세요.
3. 항상 한국어로 응답하세요.
4. 도구 호출 후 결과를 사용자에게 친절하게 설명하세요.`;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly MAX_MESSAGE_LENGTH = 500;

  constructor(
    private readonly configService: ConfigService,
    private readonly tasksService: TasksService,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  /** Strip control characters and enforce length limit */
  private sanitizeInput(input: string): string {
    return (
      input
        .slice(0, this.MAX_MESSAGE_LENGTH)
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim()
    );
  }

  private isConfigured(): boolean {
    const endpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT');
    const key = this.configService.get<string>('AZURE_OPENAI_KEY');
    return Boolean(endpoint && key);
  }

  private buildClient(): AzureOpenAI {
    const endpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT')!;
    const apiKey = this.configService.get<string>('AZURE_OPENAI_KEY')!;
    const apiVersion = '2024-10-21';
    return new AzureOpenAI({ endpoint, apiKey, apiVersion });
  }

  private getDeployment(): string {
    return (
      this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT') ?? 'gpt-4o'
    );
  }

  // ─── Tool execution ────────────────────────────────────────────────────────

  async executeCreateTask(params: {
    title: string;
    date?: string;
    priority?: string;
  }): Promise<ToolCallResult> {
    const date = params.date || this.getToday();
    const priority = (
      ['low', 'medium', 'high'].includes(params.priority ?? '')
        ? params.priority
        : 'medium'
    ) as 'low' | 'medium' | 'high';

    const task = await this.tasksService.create({
      title: params.title,
      date,
      priority,
      aiGenerated: true,
    });
    return { toolName: 'createTask', result: { success: true, task } };
  }

  async executePrioritizeTasks(params: {
    date: string;
  }): Promise<ToolCallResult> {
    const tasks = await this.tasksService.findByDate(params.date);
    const pending = tasks.filter((t) => !t.completed);
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const sorted = [...pending].sort(
      (a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1),
    );
    return {
      toolName: 'prioritizeTasks',
      result: {
        date: params.date,
        total: pending.length,
        tasks: sorted.map((t, i) => ({
          rank: i + 1,
          id: t.id,
          title: t.title,
          priority: t.priority,
        })),
      },
    };
  }

  async executeDecomposeTask(params: {
    taskId: string;
    subtasks: string[];
  }): Promise<ToolCallResult> {
    const today = this.getToday();
    const created = await Promise.all(
      params.subtasks.map((title) =>
        this.tasksService.create({
          title,
          date: today,
          aiGenerated: true,
          parentId: params.taskId,
        }),
      ),
    );
    return {
      toolName: 'decomposeTask',
      result: { success: true, parentId: params.taskId, subtasks: created },
    };
  }

  private async dispatchTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult> {
    this.logger.log(`[tool_call] ${name} args=${JSON.stringify(args).slice(0, 120)}`);
    switch (name) {
      case 'createTask':
        return this.executeCreateTask(
          args as { title: string; date?: string; priority?: string },
        );
      case 'prioritizeTasks':
        return this.executePrioritizeTasks(args as { date: string });
      case 'decomposeTask':
        return this.executeDecomposeTask(
          args as { taskId: string; subtasks: string[] },
        );
      default:
        return { toolName: name, result: { error: `Unknown tool: ${name}` } };
    }
  }

  // ─── POST /agent/chat ──────────────────────────────────────────────────────

  async chat(dto: ChatDto): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      return {
        response:
          'AI 서비스가 설정되지 않았습니다. AZURE_OPENAI_ENDPOINT를 설정해주세요.',
        toolCalls: [],
      };
    }

    const sanitized = this.sanitizeInput(dto.message);
    const today = dto.date ?? this.getToday();
    const client = this.buildClient();
    const model = this.getDeployment();

    this.logger.log(`[chat] user="${sanitized.slice(0, 80)}" date=${today}`);
    // never interpolated into the system prompt (prompt injection defense)
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `[현재 날짜: ${today}]\n${sanitized}`,
      },
    ];

    const toolCallResults: ToolCallResult[] = [];

    // Allow up to 5 tool call rounds
    for (let round = 0; round < 5; round++) {
      const completion = await client.chat.completions.create({
        model,
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
      });

      const choice = completion.choices[0];
      if (!choice) break;

      const assistantMsg = choice.message;
      messages.push(assistantMsg);

      if (choice.finish_reason === 'stop' || !assistantMsg.tool_calls?.length) {
        return {
          response: assistantMsg.content ?? '',
          toolCalls: toolCallResults,
        };
      }

      // Execute tool calls in parallel
      const toolResults = await Promise.all(
        assistantMsg.tool_calls.map(async (tc) => {
          const fn = (tc as any)['function'] as { arguments: string; name: string };
          const args = JSON.parse(fn.arguments || '{}') as Record<
            string,
            unknown
          >;
          const result = await this.dispatchTool(fn.name, args);
          toolCallResults.push(result);
          return {
            role: 'tool' as const,
            tool_call_id: tc.id,
            content: JSON.stringify(result.result),
          };
        }),
      );

      messages.push(...toolResults);
    }

    return {
      response: '처리가 완료되었습니다.',
      toolCalls: toolCallResults,
    };
  }

  // ─── GET /agent/stream (SSE) ───────────────────────────────────────────────

  stream(message: string, date?: string): Observable<{ data: SseEvent }> {
    const subject = new Subject<{ data: SseEvent }>();

    // Defer to next tick so the subscriber attaches before events are emitted
    setImmediate(() => void this.runStream(message, date, subject));

    return subject.asObservable();
  }

  private async runStream(
    message: string,
    date: string | undefined,
    subject: Subject<{ data: SseEvent }>,
  ): Promise<void> {
    if (!this.isConfigured()) {
      subject.next({
        data: {
          type: 'token',
          content:
            'AI 서비스가 설정되지 않았습니다. AZURE_OPENAI_ENDPOINT를 설정해주세요.',
        },
      });
      subject.next({ data: { type: 'done' } });
      subject.complete();
      return;
    }

    const sanitized = this.sanitizeInput(message);
    const today = date ?? this.getToday();
    const client = this.buildClient();
    const model = this.getDeployment();

    this.logger.log(`[stream] user="${sanitized.slice(0, 80)}" date=${today}`);

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `[현재 날짜: ${today}]\n${sanitized}`,
      },
    ];

    const toolCallResults: ToolCallResult[] = [];

    try {
      for (let round = 0; round < 5; round++) {
        // First check if we need tool calls (non-streaming for tool call detection)
        const completion = await client.chat.completions.create({
          model,
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
        });

        const choice = completion.choices[0];
        if (!choice) break;

        const assistantMsg = choice.message;
        messages.push(assistantMsg);

        if (assistantMsg.tool_calls?.length) {
          // Execute tool calls
          const toolResults = await Promise.all(
            assistantMsg.tool_calls.map(async (tc) => {
              const fn = (tc as any)['function'] as {
                arguments: string;
                name: string;
              };
              const args = JSON.parse(fn.arguments || '{}') as Record<
                string,
                unknown
              >;
              const toolName = fn.name;
              const result = await this.dispatchTool(toolName, args);
              toolCallResults.push(result);
              subject.next({
                data: {
                  type: 'tool_call',
                  toolName,
                  toolResult: result.result,
                },
              });
              return {
                role: 'tool' as const,
                tool_call_id: tc.id,
                content: JSON.stringify(result.result),
              };
            }),
          );
          messages.push(...toolResults);
          continue;
        }

        // Final response — stream tokens
        if (
          choice.finish_reason === 'stop' ||
          !assistantMsg.tool_calls?.length
        ) {
          const streamCompletion = await client.chat.completions.create({
            model,
            messages,
            stream: true,
          });

          for await (const chunk of streamCompletion) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              subject.next({ data: { type: 'token', content: delta } });
            }
          }
          break;
        }
      }

      subject.next({ data: { type: 'done' } });
      subject.complete();
    } catch (err) {
      this.logger.error('Stream error', err);
      subject.next({
        data: {
          type: 'error',
          content: err instanceof Error ? err.message : 'Unknown error',
        },
      });
      subject.complete();
    }
  }
}
