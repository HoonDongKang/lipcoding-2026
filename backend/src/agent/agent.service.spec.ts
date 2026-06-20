/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AgentService } from './agent.service';
import { TasksService } from '../tasks/tasks.service';

const mockTasksService = {
  create: jest.fn(),
  findByDate: jest.fn(),
  update: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('AgentService', () => {
  let service: AgentService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        { provide: TasksService, useValue: mockTasksService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
  });

  // ─── chat — no config ───────────────────────────────────────────────

  describe('chat — no config', () => {
    it('returns setup instructions when env vars are missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const result = await service.chat({ message: '할 일 추가해줘' });

      expect(result.response).toContain('AZURE_OPENAI_ENDPOINT');
      expect(result.toolCalls).toHaveLength(0);
    });

    it('handles messages longer than 500 characters gracefully', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      const longMsg = 'a'.repeat(600);

      const result = await service.chat({ message: longMsg });
      expect(result).toBeDefined();
    });
  });

  // ─── stream — no config ───────────────────────────────────────────────

  describe('stream — no config', () => {
    it('emits setup message then done when not configured', (done) => {
      mockConfigService.get.mockReturnValue(undefined);

      const events: Array<{ data: { type: string; content?: string } }> = [];
      const obs = service.stream('테스트');

      obs.subscribe({
        next: (ev) => events.push(ev),
        complete: () => {
          expect(events.length).toBeGreaterThanOrEqual(2);
          const tokenEvent = events.find((e) => e.data.type === 'token');
          const doneEvent = events.find((e) => e.data.type === 'done');
          expect(tokenEvent).toBeDefined();
          expect(tokenEvent?.data.content).toContain('AZURE_OPENAI_ENDPOINT');
          expect(doneEvent).toBeDefined();
          done();
        },
      });
    });
  });

  // ─── GitHub issue — no PAT ────────────────────────────────────────────

  describe('GitHub issue creation — no PAT', () => {
    it('returns error in tool result when PAT is missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const svc = service as any;

      const tools: Array<{
        name: string;
        handler: (args: unknown) => Promise<{ error?: string }>;
      }> = svc.buildTools('2026-06-20', undefined, undefined, []);

      const githubTool = tools.find((t) => t.name === 'createGitHubIssue');
      expect(githubTool).toBeDefined();

      const result = await githubTool!.handler({ title: '테스트 이슈' });
      expect(result.error).toContain('GITHUB_PAT');
    });
  });
});
