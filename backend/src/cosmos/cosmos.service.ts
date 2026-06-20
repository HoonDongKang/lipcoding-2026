import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CosmosClient, Container, Database } from '@azure/cosmos';

@Injectable()
export class CosmosService implements OnModuleInit {
  private readonly logger = new Logger(CosmosService.name);
  private client: CosmosClient | null = null;
  private database: Database | null = null;
  private container: Container | null = null;

  private readonly endpoint = process.env.COSMOS_ENDPOINT ?? '';
  private readonly key = process.env.COSMOS_KEY ?? '';
  private readonly databaseId = process.env.COSMOS_DATABASE ?? 'smarttaskhub';
  private readonly containerId = process.env.COSMOS_CONTAINER ?? 'tasks';

  async onModuleInit(): Promise<void> {
    if (!this.endpoint || !this.key) {
      this.logger.warn(
        'COSMOS_ENDPOINT or COSMOS_KEY not set — Cosmos DB disabled (graceful fallback)',
      );
      return;
    }

    try {
      this.client = new CosmosClient({
        endpoint: this.endpoint,
        key: this.key,
      });

      const { database } = await this.client.databases.createIfNotExists({
        id: this.databaseId,
      });
      this.database = database;

      const { container } = await database.containers.createIfNotExists({
        id: this.containerId,
        partitionKey: { paths: ['/date'] },
      });
      this.container = container;

      this.logger.log(
        `Cosmos DB connected: ${this.databaseId}/${this.containerId}`,
      );
    } catch (err) {
      this.logger.error('Failed to connect to Cosmos DB', err);
      this.client = null;
      this.database = null;
      this.container = null;
    }
  }

  getContainer(): Container | null {
    return this.container;
  }

  isConnected(): boolean {
    return this.container !== null;
  }
}
