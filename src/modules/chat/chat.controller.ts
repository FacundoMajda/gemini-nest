import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { InferenceService } from '../inference/inference.service';
import { ChatRequestDto } from './dto/create-chat.dto';
import { generateId } from 'ai';

@Controller('api/chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly inferenceService: InferenceService) {}

  @Post('generate')
  async generateChatResponse(
    @Body() chatRequestDto: ChatRequestDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const sessionId =
      (request.headers['x-session-id'] as string) || generateId();
    this.logger.log(
      `[${sessionId}] ChatController: POST /generate. SystemPrompt: ${!!chatRequestDto.systemPrompt}, Msgs: ${chatRequestDto.messages.length} ✍️📨`,
    );

    try {
      const { messages, systemPrompt } = chatRequestDto;

      const coreMessages = messages.map((message) => ({
        ...message,
        role:
          message.role === 'system' ||
          message.role === 'user' ||
          message.role === 'assistant'
            ? message.role
            : 'tool',
      }));

      const result = await this.inferenceService.generateTextResponse(
        coreMessages as any,
        sessionId,
        systemPrompt,
      );

      if (result.toolCalls && result.toolCalls.length > 0) {
        this.logger.log(
          `[${sessionId}] ChatController: generateText involucró llamadas a herramientas. Texto final: "${result.text}" ✨🛠️`,
        );
      }

      return response.status(HttpStatus.OK).json({ sessionId, ...result });
    } catch (error) {
      this.logger.error(
        `[${sessionId}] ChatController: Error en endpoint /generate: ${error.message} 🔥💥`,
        error.stack,
      );
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        sessionId,
        message: 'Error procesando la solicitud de chat generativo. 😔',
        error: error.message,
      });
    }
  }
}
