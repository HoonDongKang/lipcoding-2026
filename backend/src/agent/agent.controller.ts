import {
  Controller,
  Post,
  Body,
  Query,
  Sse,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AgentService } from './agent.service';
import type { ChatDto } from './agent.service';

@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  /**
   * POST /agent/chat
   * Body: { message: string, date?: string }
   * Returns JSON response after agent processes the message.
   */
  @Post('chat')
  async chat(@Body() body: ChatDto) {
    const message = body?.message;
    if (!message || typeof message !== 'string') {
      throw new BadRequestException('message is required');
    }
    if (message.length > 500) {
      throw new BadRequestException('message must be 500 characters or less');
    }
    return this.agentService.chat({ message, date: body.date });
  }

  /**
   * GET /agent/stream
   * Query: message, date
   * Returns Server-Sent Events (SSE) stream.
   */
  @Sse('stream')
  stream(
    @Query('message') message: string,
    @Query('date') date?: string,
  ): Observable<MessageEvent> {
    if (!message || typeof message !== 'string') {
      throw new BadRequestException('message query param is required');
    }
    if (message.length > 500) {
      throw new BadRequestException('message must be 500 characters or less');
    }
    return this.agentService.stream(message, date) as Observable<MessageEvent>;
  }
}
