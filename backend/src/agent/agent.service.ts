/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
/**
 * AgentService — GitHub Copilot SDK Agent with Azure OpenAI BYOK
 *
 * Uses @github/copilot-sdk with BYOK (Azure OpenAI) for LLM calls.
 * Custom tools defined via defineTool + Zod schemas.
 * SSE streaming via session.on("assistant.message") events.
 *
 * Environment variables:
 *   AZURE_OPENAI_ENDPOINT   — e.g. https://xxx.openai.azure.com/
 *   AZURE_OPENAI_KEY        — Azure API key
 *   AZURE_OPENAI_DEPLOYMENT — deployment name (default: gpt-4o)
 *   GITHUB_PAT              — GitHub Personal Access Token (repo scope)
 *   GITHUB_REPO             — owner/repo (default: HoonDongKang/lipcoding-2026)
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, Subject } from 'rxjs';
import { CopilotClient, defineTool, approveAll } from '@github/copilot-sdk';
import { z } from 'zod';
import { TasksService } from '../tasks/tasks.service';

export interface ChatDto {
  message: string;
  date?: string;
  githubPat?: string;
  githubRepo?: string;
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

const SYSTEM_PROMPT = `당신은 Smart Task Hub의 AI 비서입니다.
사용자가 자연어로 할 일 관리를 요청하면, 적절한 도구를 호출해 처리합니다.

사용 가능한 도구:
- createTask: 새 할 일 생성
- prioritizeTasks: 특정 날짜의 할 일 우선순위 분석
- decomposeTask: 복잡한 태스크를 서브태스크로 분해
- createGitHubIssue: 할 일에 대한 GitHub 이슈 생성

규칙:
1. 날짜가 언급되지 않으면 오늘 날짜를 사용하세요.
2. 항상 한국어로 응답하세요.
3. 도구 호출 후 결과를 사용자에게 친절하게 설명하세요.
4. GitHub 이슈 생성 후 이슈 URL을 사용자에게 알려주세요.`;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly MAX_MESSAGE_LENGTH = 500;

  constructor(
    private readonly configService: ConfigService,
    private readonly tasksService: TasksService,
  ) {}

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

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

  private getProviderConfig() {
    const endpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT')!;
    const apiKey = this.configService.get<string>('AZURE_OPENAI_KEY')!;
    // Strip trailing slash for SDK
    const baseUrl = endpoint.replace(/\/$/, '');
    return {
      type: 'azure' as const,
      baseUrl,
      apiKey,
      azure: { apiVersion: '2024-10-21' },
    };
  }

  private getModel(): string {
    return (
      this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT') ?? 'gpt-4o'
    );
  }

  /** Build Copilot SDK tools with closures for GitHub PAT/Repo */
  private buildTools(
    today: string,
    githubPat?: string,
    githubRepo?: string,
    toolCallResults?: ToolCallResult[],
  ) {
    const effectivePat =
      githubPat || this.configService.get<string>('GITHUB_PAT');
    const effectiveRepo =
      githubRepo ||
      this.configService.get<string>('GITHUB_REPO') ||
      'HoonDongKang/lipcoding-2026';

    const tasksService = this.tasksService;
    const logger = this.logger;

    return [
      defineTool('createTask', {
        description:
          '할 일(Todo)을 생성합니다. 날짜와 우선순위를 지정할 수 있습니다.',
        parameters: z.object({
          title: z.string().describe('할 일 제목'),
          date: z
            .string()
            .optional()
            .describe('날짜 (YYYY-MM-DD). 생략 시 오늘 날짜'),
          priority: z
            .enum(['low', 'medium', 'high'])
            .optional()
            .describe('우선순위'),
        }),
        skipPermission: true,
        handler: async ({ title, date, priority }) => {
          const task = await tasksService.create({
            title,
            date: date ?? today,
            priority: priority ?? 'medium',
            aiGenerated: true,
          });
          logger.log(
            `[tool_call] createTask title="${title}" date=${date ?? today}`,
          );
          const result = { success: true, task };
          toolCallResults?.push({ toolName: 'createTask', result });
          return result;
        },
      }),

      defineTool('prioritizeTasks', {
        description:
          '특정 날짜의 미완료 할 일을 우선순위 순으로 분석해 반환합니다.',
        parameters: z.object({
          date: z.string().describe('분석할 날짜 (YYYY-MM-DD)'),
        }),
        skipPermission: true,
        handler: async ({ date }) => {
          const tasks = await tasksService.findByDate(date);
          const pending = tasks.filter((t) => !t.completed);
          const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
          const sorted = [...pending].sort(
            (a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1),
          );
          logger.log(
            `[tool_call] prioritizeTasks date=${date} count=${pending.length}`,
          );
          const result = {
            date,
            total: pending.length,
            tasks: sorted.map((t, i) => ({
              rank: i + 1,
              id: t.id,
              title: t.title,
              priority: t.priority,
            })),
          };
          toolCallResults?.push({ toolName: 'prioritizeTasks', result });
          return result;
        },
      }),

      defineTool('decomposeTask', {
        description: '복잡한 태스크를 서브태스크 목록으로 분해합니다.',
        parameters: z.object({
          taskId: z.string().describe('분해할 부모 태스크 ID'),
          subtasks: z.array(z.string()).describe('서브태스크 제목 배열'),
        }),
        skipPermission: true,
        handler: async ({ taskId, subtasks }) => {
          const created = await Promise.all(
            subtasks.map((title) =>
              tasksService.create({
                title,
                date: today,
                aiGenerated: true,
                parentId: taskId,
              }),
            ),
          );
          logger.log(
            `[tool_call] decomposeTask parentId=${taskId} count=${subtasks.length}`,
          );
          const result = { success: true, parentId: taskId, subtasks: created };
          toolCallResults?.push({ toolName: 'decomposeTask', result });
          return result;
        },
      }),

      defineTool('createGitHubIssue', {
        description:
          '할 일에 대한 GitHub 이슈를 생성합니다. 사용자가 GitHub 이슈 만들기 또는 이슈 등록을 요청할 때 사용합니다.',
        parameters: z.object({
          title: z.string().describe('이슈 제목'),
          body: z.string().optional().describe('이슈 내용 (마크다운 지원)'),
          taskId: z.string().optional().describe('연결할 태스크 ID'),
        }),
        skipPermission: true,
        handler: async ({ title, body, taskId }) => {
          if (!effectivePat) {
            logger.warn('[createGitHubIssue] GITHUB_PAT not configured');
            const result = {
              error:
                'GITHUB_PAT가 설정되지 않았습니다. ⚙️ 설정에서 GitHub PAT를 등록해주세요.',
            };
            toolCallResults?.push({ toolName: 'createGitHubIssue', result });
            return result;
          }

          const [owner, repoName] = effectiveRepo.split('/');
          logger.log(
            `[tool_call] createGitHubIssue title="${title}" repo=${effectiveRepo}`,
          );

          let issueData: {
            html_url?: string;
            number?: number;
            message?: string;
          };
          try {
            const response = await fetch(
              `https://api.github.com/repos/${owner}/${repoName}/issues`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${effectivePat}`,
                  Accept: 'application/vnd.github.v3+json',
                  'Content-Type': 'application/json',
                  'User-Agent': 'SmartTaskHub/1.0',
                },
                body: JSON.stringify({ title, body: body ?? '' }),
              },
            );

            issueData = (await response.json()) as {
              html_url?: string;
              number?: number;
              message?: string;
            };

            if (!response.ok) {
              const result = {
                error: `GitHub API 오류: ${issueData.message ?? response.status}`,
              };
              toolCallResults?.push({ toolName: 'createGitHubIssue', result });
              return result;
            }
          } catch (err) {
            const result = {
              error: `GitHub API 호출 실패: ${err instanceof Error ? err.message : String(err)}`,
            };
            toolCallResults?.push({ toolName: 'createGitHubIssue', result });
            return result;
          }

          if (taskId && issueData.html_url) {
            try {
              await tasksService.update(taskId, {
                githubIssueUrl: issueData.html_url,
              });
              logger.log(
                `[createGitHubIssue] Linked issue #${issueData.number} → task ${taskId}`,
              );
            } catch {
              logger.warn(
                `[createGitHubIssue] Could not link issue to task ${taskId}`,
              );
            }
          }

          const result = {
            issueUrl: issueData.html_url,
            issueNumber: issueData.number,
            repo: effectiveRepo,
          };
          toolCallResults?.push({ toolName: 'createGitHubIssue', result });
          return result;
        },
      }),
    ];
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
    this.logger.log(`[chat] user="${sanitized.slice(0, 80)}" date=${today}`);

    const toolCallResults: ToolCallResult[] = [];
    const client = new CopilotClient();
    await client.start();

    try {
      const session = await client.createSession({
        model: this.getModel(),
        provider: this.getProviderConfig(),
        onPermissionRequest: approveAll,
        systemMessage: { content: SYSTEM_PROMPT },
        tools: this.buildTools(
          today,
          dto.githubPat,
          dto.githubRepo,
          toolCallResults,
        ),
      });

      const result = await session.sendAndWait({
        prompt: `[현재 날짜: ${today}]\n${sanitized}`,
      });

      await session.disconnect();

      const content =
        (result?.data as any)?.content ?? '처리가 완료되었습니다.';
      return { response: String(content), toolCalls: toolCallResults };
    } finally {
      await client.stop();
    }
  }

  // ─── GET /agent/stream (SSE) ───────────────────────────────────────────────

  stream(
    message: string,
    date?: string,
    githubPat?: string,
    githubRepo?: string,
  ): Observable<{ data: SseEvent }> {
    const subject = new Subject<{ data: SseEvent }>();
    setImmediate(
      () => void this.runStream(message, date, subject, githubPat, githubRepo),
    );
    return subject.asObservable();
  }

  private async runStream(
    message: string,
    date: string | undefined,
    subject: Subject<{ data: SseEvent }>,
    githubPat?: string,
    githubRepo?: string,
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
    this.logger.log(`[stream] user="${sanitized.slice(0, 80)}" date=${today}`);

    const client = new CopilotClient();
    await client.start();

    try {
      const session = await client.createSession({
        model: this.getModel(),
        provider: this.getProviderConfig(),
        onPermissionRequest: approveAll,
        systemMessage: { content: SYSTEM_PROMPT },
        tools: this.buildTools(today, githubPat, githubRepo),
      });

      // Emit token events for each assistant message chunk
      session.on('assistant.message', (event) => {
        const content = (event.data as any)?.content;
        if (content) {
          subject.next({ data: { type: 'token', content: String(content) } });
        }
      });

      // Emit tool_call events when tools fire
      session.on('tool.execution_complete', (event) => {
        const ev = event as any;
        const toolName = ev?.data?.toolName ?? ev?.data?.name ?? 'unknown';
        const toolResult = ev?.data?.result;
        this.logger.log(`[tool_call] ${String(toolName)} complete`);
        subject.next({
          data: { type: 'tool_call', toolName: String(toolName), toolResult },
        });
      });

      await session.sendAndWait({
        prompt: `[현재 날짜: ${today}]\n${sanitized}`,
      });

      subject.next({ data: { type: 'done' } });
      subject.complete();
      await session.disconnect();
    } catch (err) {
      this.logger.error('Stream error', err);
      subject.next({
        data: {
          type: 'error',
          content: err instanceof Error ? err.message : 'Unknown error',
        },
      });
      subject.complete();
    } finally {
      await client.stop();
    }
  }
}
