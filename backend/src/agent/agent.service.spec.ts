import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AgentService } from './agent.service';
import { TasksService } from '../tasks/tasks.service';
import { Task } from '../tasks/task.entity';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Test Task',
  date: '2026-06-20',
  completed: false,
  priority: 'medium',
  aiGenerated: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const mockTasksService = {
  create: jest.fn(),
  findByDate: jest.fn(),
  update: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

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

  // ─── isConfigured (via chat mock response) ──────────────────────────────

  describe('chat — no config', () => {
    it('returns setup instructions when env vars are missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const result = await service.chat({ message: '할 일 추가해줘' });

      expect(result.response).toContain('AZURE_OPENAI_ENDPOINT');
      expect(result.toolCalls).toHaveLength(0);
    });

    it('rejects messages longer than 500 characters gracefully', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      const longMsg = 'a'.repeat(600);

      const result = await service.chat({ message: longMsg });
      // Service handles gracefully (sanitizes), no throw
      expect(result).toBeDefined();
    });
  });

  // ─── executeCreateTask ────────────────────────────────────────────────────

  describe('executeCreateTask', () => {
    it('creates a task with aiGenerated=true', async () => {
      const created = mockTask({ title: 'PR 리뷰', date: '2026-06-23' });
      mockTasksService.create.mockResolvedValue(created);

      const result = await service.executeCreateTask({
        title: 'PR 리뷰',
        date: '2026-06-23',
        priority: 'high',
      });

      expect(mockTasksService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'PR 리뷰',
          date: '2026-06-23',
          priority: 'high',
          aiGenerated: true,
        }),
      );
      expect(result.toolName).toBe('createTask');
      expect((result.result as { success: boolean }).success).toBe(true);
      expect((result.result as { task: Task }).task).toEqual(created);
    });

    it('uses today as default date when omitted', async () => {
      const today = new Date().toISOString().split('T')[0];
      const created = mockTask({ date: today });
      mockTasksService.create.mockResolvedValue(created);

      await service.executeCreateTask({ title: '오늘 할 일' });

      expect(mockTasksService.create).toHaveBeenCalledWith(
        expect.objectContaining({ date: today }),
      );
    });

    it('defaults to medium priority when invalid priority provided', async () => {
      const created = mockTask({ priority: 'medium' });
      mockTasksService.create.mockResolvedValue(created);

      await service.executeCreateTask({
        title: '테스트',
        priority: 'super-urgent', // invalid
      });

      expect(mockTasksService.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'medium' }),
      );
    });
  });

  // ─── executePrioritizeTasks ───────────────────────────────────────────────

  describe('executePrioritizeTasks', () => {
    it('returns tasks sorted by priority (high → medium → low)', async () => {
      const tasks: Task[] = [
        mockTask({
          id: '1',
          title: 'Low task',
          priority: 'low',
          completed: false,
        }),
        mockTask({
          id: '2',
          title: 'High task',
          priority: 'high',
          completed: false,
        }),
        mockTask({
          id: '3',
          title: 'Medium task',
          priority: 'medium',
          completed: false,
        }),
        mockTask({ id: '4', title: 'Done', priority: 'high', completed: true }),
      ];
      mockTasksService.findByDate.mockResolvedValue(tasks);

      const result = await service.executePrioritizeTasks({
        date: '2026-06-20',
      });
      const data = result.result as {
        date: string;
        total: number;
        tasks: Array<{ rank: number; title: string; priority: string }>;
      };

      expect(data.total).toBe(3); // excludes completed
      expect(data.tasks[0].title).toBe('High task');
      expect(data.tasks[1].title).toBe('Medium task');
      expect(data.tasks[2].title).toBe('Low task');
      expect(data.tasks[0].rank).toBe(1);
    });

    it('returns empty list when no pending tasks', async () => {
      mockTasksService.findByDate.mockResolvedValue([]);

      const result = await service.executePrioritizeTasks({
        date: '2026-06-20',
      });
      const data = result.result as { total: number; tasks: unknown[] };

      expect(data.total).toBe(0);
      expect(data.tasks).toHaveLength(0);
    });
  });

  // ─── executeDecomposeTask ─────────────────────────────────────────────────

  describe('executeDecomposeTask', () => {
    it('creates subtasks with parentId set', async () => {
      const subtask1 = mockTask({
        id: 'sub-1',
        title: '설계',
        parentId: 'parent-1',
      });
      const subtask2 = mockTask({
        id: 'sub-2',
        title: '구현',
        parentId: 'parent-1',
      });
      mockTasksService.create
        .mockResolvedValueOnce(subtask1)
        .mockResolvedValueOnce(subtask2);

      const result = await service.executeDecomposeTask({
        taskId: 'parent-1',
        subtasks: ['설계', '구현'],
      });

      expect(mockTasksService.create).toHaveBeenCalledTimes(2);
      expect(mockTasksService.create).toHaveBeenCalledWith(
        expect.objectContaining({ parentId: 'parent-1', aiGenerated: true }),
      );

      const data = result.result as {
        success: boolean;
        parentId: string;
        subtasks: Task[];
      };
      expect(data.success).toBe(true);
      expect(data.parentId).toBe('parent-1');
      expect(data.subtasks).toHaveLength(2);
    });
  });

  // ─── executeCreateGitHubIssue ─────────────────────────────────────────────

  describe('executeCreateGitHubIssue', () => {
    const mockFetch = jest.fn();

    beforeEach(() => {
      global.fetch = mockFetch;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns error when GITHUB_PAT is not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GITHUB_PAT') return undefined;
        return undefined;
      });

      const result = await service.executeCreateGitHubIssue({
        title: '테스트 이슈',
      });

      expect(result.toolName).toBe('createGitHubIssue');
      expect((result.result as { error: string }).error).toContain(
        'GITHUB_PAT',
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('creates a GitHub issue and returns issueUrl', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GITHUB_PAT') return 'ghp_testtoken';
        if (key === 'GITHUB_REPO') return 'testowner/testrepo';
        return undefined;
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            html_url: 'https://github.com/testowner/testrepo/issues/42',
            number: 42,
          }),
      });

      const result = await service.executeCreateGitHubIssue({
        title: '테스트 이슈',
        body: '이슈 내용',
      });

      expect(result.toolName).toBe('createGitHubIssue');
      const data = result.result as {
        issueUrl: string;
        issueNumber: number;
        repo: string;
      };
      expect(data.issueUrl).toBe(
        'https://github.com/testowner/testrepo/issues/42',
      );
      expect(data.issueNumber).toBe(42);
      expect(data.repo).toBe('testowner/testrepo');
    });

    it('links issue URL to task when taskId is provided', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GITHUB_PAT') return 'ghp_testtoken';
        if (key === 'GITHUB_REPO') return 'testowner/testrepo';
        return undefined;
      });

      const issueUrl = 'https://github.com/testowner/testrepo/issues/7';
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ html_url: issueUrl, number: 7 }),
      });
      mockTasksService.update.mockResolvedValue(
        mockTask({ id: 'task-abc', githubIssueUrl: issueUrl }),
      );

      await service.executeCreateGitHubIssue({
        title: '이슈 연결 테스트',
        taskId: 'task-abc',
      });

      expect(mockTasksService.update).toHaveBeenCalledWith('task-abc', {
        githubIssueUrl: issueUrl,
      });
    });

    it('returns error when GitHub API responds with non-ok status', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GITHUB_PAT') return 'ghp_badtoken';
        if (key === 'GITHUB_REPO') return 'testowner/testrepo';
        return undefined;
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Bad credentials' }),
      });

      const result = await service.executeCreateGitHubIssue({
        title: '실패 이슈',
      });

      expect((result.result as { error: string }).error).toContain(
        'Bad credentials',
      );
    });
  });

  // ─── stream — no config ───────────────────────────────────────────────────

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
});
