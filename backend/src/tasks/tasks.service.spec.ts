import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CosmosService } from '../cosmos/cosmos.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const mockCosmosService = {
  getContainer: jest.fn().mockReturnValue(null), // Cosmos disabled → in-memory
  isConnected: jest.fn().mockReturnValue(false),
};

describe('TasksService (in-memory fallback)', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: CosmosService, useValue: mockCosmosService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    // Reset in-memory store between tests
    Object.assign(service, { inMemoryTasks: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockCosmosService.getContainer.mockReturnValue(null);
  });

  describe('create()', () => {
    it('should create a task with defaults', async () => {
      const dto: CreateTaskDto = { title: 'Write tests', date: '2026-06-20' };
      const task = await service.create(dto);

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Write tests');
      expect(task.date).toBe('2026-06-20');
      expect(task.completed).toBe(false);
      expect(task.priority).toBe('medium');
      expect(task.aiGenerated).toBe(false);
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
    });

    it('should create a task with explicit priority and completed', async () => {
      const dto: CreateTaskDto = {
        title: 'Deploy',
        date: '2026-06-21',
        priority: 'high',
        completed: true,
      };
      const task = await service.create(dto);

      expect(task.priority).toBe('high');
      expect(task.completed).toBe(true);
    });
  });

  describe('findByDate()', () => {
    it('should return tasks for the given date', async () => {
      await service.create({ title: 'Task A', date: '2026-06-20' });
      await service.create({ title: 'Task B', date: '2026-06-20' });
      await service.create({ title: 'Task C', date: '2026-06-21' });

      const results = await service.findByDate('2026-06-20');
      expect(results).toHaveLength(2);
      expect(results.every((t) => t.date === '2026-06-20')).toBe(true);
    });

    it('should return empty array when no tasks for that date', async () => {
      const results = await service.findByDate('2099-01-01');
      expect(results).toEqual([]);
    });
  });

  describe('update()', () => {
    it('should update task fields', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-20T10:00:00.000Z'));

      const created = await service.create({
        title: 'Old title',
        date: '2026-06-20',
      });

      // Advance time so updatedAt differs from createdAt
      jest.advanceTimersByTime(1000);

      const dto: UpdateTaskDto = { title: 'New title', completed: true };
      const updated = await service.update(created.id, dto);

      expect(updated.title).toBe('New title');
      expect(updated.completed).toBe(true);
      expect(updated.date).toBe('2026-06-20'); // unchanged
      expect(updated.updatedAt).not.toBe(created.updatedAt);

      jest.useRealTimers();
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(
        service.update('non-existent-id', { completed: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should move task to new date', async () => {
      const created = await service.create({
        title: 'Move me',
        date: '2026-06-20',
      });

      const updated = await service.update(created.id, { date: '2026-06-25' });
      expect(updated.date).toBe('2026-06-25');

      const oldDateTasks = await service.findByDate('2026-06-20');
      expect(oldDateTasks).toHaveLength(0);

      const newDateTasks = await service.findByDate('2026-06-25');
      expect(newDateTasks).toHaveLength(1);
    });
  });

  describe('remove()', () => {
    it('should delete a task', async () => {
      const created = await service.create({
        title: 'Delete me',
        date: '2026-06-20',
      });

      await expect(service.remove(created.id)).resolves.toBeUndefined();

      const remaining = await service.findByDate('2026-06-20');
      expect(remaining).toHaveLength(0);
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.remove('ghost-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
