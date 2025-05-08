import { Injectable, Logger } from '@nestjs/common';
import { CoreMessage } from 'ai';
import { InferenceService } from '../inference/inference.service';

export interface ChatSession {
  sessionId: string;
  history: CoreMessage[];
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly inferenceService: InferenceService) {}

  async handleGenerateRequest(
    sessionId: string,
    currentMessages: CoreMessage[],
    systemPrompt?: string,
  ): Promise<{
    text: string;
    toolCalls?: any[];
    toolResults?: any[];
    finishReason?: string;
  }> {
    this.logger.log(
      `[${sessionId}] ChatService: Manejando solicitud de generación. ✍️💬`,
    );

    const messagesForAI = currentMessages;
    const result = await this.inferenceService.generateTextResponse(
      messagesForAI,
      sessionId,
      systemPrompt,
    );

    return result;
  }
}
