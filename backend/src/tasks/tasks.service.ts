import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CosmosService } from '../cosmos/cosmos.service';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  // In-memory fallback when Cosmos is not available
  private inMemoryTasks: Task[] = [];

  constructor(private readonly cosmosService: CosmosService) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      title: dto.title,
      date: dto.date,
      completed: dto.completed ?? false,
      priority: dto.priority ?? 'medium',
      aiGenerated: dto.aiGenerated ?? false,
      githubIssueUrl: dto.githubIssueUrl,
      parentId: dto.parentId,
      createdAt: now,
      updatedAt: now,
    };

    const container = this.cosmosService.getContainer();
    if (container) {
      const { resource } = await container.items.create(task);
      return resource as Task;
    }

    this.logger.warn('Cosmos unavailable — using in-memory store');
    this.inMemoryTasks.push(task);
    return task;
  }

  async findByDate(date: string): Promise<Task[]> {
    const container = this.cosmosService.getContainer();
    if (container) {
      const query = {
        query: 'SELECT * FROM c WHERE c.date = @date ORDER BY c.createdAt ASC',
        parameters: [{ name: '@date', value: date }],
      };
      const { resources } = await container.items.query<Task>(query).fetchAll();
      return resources;
    }

    this.logger.warn('Cosmos unavailable — using in-memory store');
    return this.inMemoryTasks.filter((t) => t.date === date);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const container = this.cosmosService.getContainer();
    if (container) {
      // First fetch the existing item to get partitionKey (date)
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      };
      const { resources } = await container.items
        .query<Task>(querySpec)
        .fetchAll();

      if (!resources.length) {
        throw new NotFoundException(`Task ${id} not found`);
      }

      const existing = resources[0];
      const now = new Date().toISOString();

      // Strip Cosmos system properties before upsert to avoid conflicts
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _rid, _self, _attachments, _ts, _etag, ...cleanExisting } =
        existing as Task & Record<string, unknown>;

      const updated: Task = { ...cleanExisting, ...dto, updatedAt: now };

      try {
        const { resource } = await container
          .item(id, existing.date)
          .replace(updated);
        return resource as Task;
      } catch (replaceErr) {
        // Fallback to upsert if replace fails (e.g., etag/session token issues)
        this.logger.warn(
          `replace() failed, falling back to upsert: ${String(replaceErr)}`,
        );
        const { resource } = await container.items.upsert<Task>(updated);
        return resource as Task;
      }
    }

    this.logger.warn('Cosmos unavailable — using in-memory store');
    const idx = this.inMemoryTasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new NotFoundException(`Task ${id} not found`);
    this.inMemoryTasks[idx] = {
      ...this.inMemoryTasks[idx],
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    return this.inMemoryTasks[idx];
  }

  async remove(id: string): Promise<void> {
    const container = this.cosmosService.getContainer();
    if (container) {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      };
      const { resources } = await container.items
        .query<Task>(querySpec)
        .fetchAll();

      if (!resources.length) {
        throw new NotFoundException(`Task ${id} not found`);
      }

      const existing = resources[0];
      await container.item(id, existing.date).delete();
      return;
    }

    this.logger.warn('Cosmos unavailable — using in-memory store');
    const idx = this.inMemoryTasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new NotFoundException(`Task ${id} not found`);
    this.inMemoryTasks.splice(idx, 1);
  }
}
