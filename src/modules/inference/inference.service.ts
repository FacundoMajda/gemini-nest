import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreMessage, ToolCallPart, ToolResultPart, generateText } from 'ai';
import { ToolService } from '../tool/tool.service';

@Injectable()
export class InferenceService implements OnModuleInit {
  private readonly logger = new Logger(InferenceService.name);
  private geminiChatModel: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly toolService: ToolService,
  ) {}

  onModuleInit() {
    const apiKeyFromConfig = this.configService.get<string>('GOOGLE_API_KEY');
    const apiKeyFromEnv =
      process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const apiKey = apiKeyFromConfig || apiKeyFromEnv;

    if (!apiKey) {
      this.logger.error(
        'GOOGLE_API_KEY (o GOOGLE_GENERATIVE_AI_API_KEY) no está configurada. El servicio de IA no funcionará. 🔑❌',
      );
      return;
    }

    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    this.geminiChatModel = google('gemini-2.5-pro-exp-03-25');
    this.logger.log(
      `Modelo de Chat Gemini (gemini-2.5-pro-exp-03-25) inicializado. 🤖✨`,
    );
  }

  async generateTextResponse(
    messages: CoreMessage[],
    sessionId?: string,
    systemPrompt?: string,
  ): Promise<{
    text: string;
    toolCalls?: ToolCallPart[];
    toolResults?: ToolResultPart[];
    finishReason?: string;
  }> {
    if (!this.geminiChatModel) {
      this.logger.error(
        `[${sessionId || 'N/A'}] Modelo Gemini no inicializado. No se puede generar respuesta de texto. 🤖❌`,
      );
      throw new Error('El modelo de IA no está disponible.');
    }
    this.logger.debug(
      `[${sessionId || 'N/A'}] Servicio AI: Generando texto no transmitido. Msgs: ${messages.length}, SysPrompt: ${!!systemPrompt} 📝`,
    );

    const toolsWithExecute =
      this.toolService.getToolsWithExecuteFunctionForAI();

    const { text, toolCalls, toolResults, finishReason, usage } =
      await generateText({
        model: this.geminiChatModel,
        messages: messages,
        system: systemPrompt,
        tools: toolsWithExecute,
      });

    this.logger.log(
      `[${sessionId || 'N/A'}] Servicio AI: generateText finalizado. Razón: ${finishReason}, Tokens: ${JSON.stringify(usage)} ✅📊`,
    );
    return {
      text,
      toolCalls: toolCalls as ToolCallPart[],
      toolResults: toolResults as ToolResultPart[],
      finishReason,
    };
  }
}
