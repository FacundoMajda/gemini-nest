import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ZodSchema, z } from 'zod';
import { toolDefinitions, ToolName } from './definitions';

// Interfaz para la definición de una herramienta, con tipado genérico para parámetros y resultado
export interface ToolDefinition<
  TParamsSchema extends ZodSchema = ZodSchema,
  TExecuteResult = any, // El tipo del resultado crudo de la función execute
> {
  name: string;
  description: string;
  parametersSchema: TParamsSchema;
  execute: (params: z.infer<TParamsSchema>) => Promise<TExecuteResult>;
}

// Formato que espera el AI SDK para las herramientas cuando se quiere que el SDK maneje el ciclo de ejecución
export type AIToolSettingsWithExecute<
  TParamsSchema extends ZodSchema = ZodSchema,
  TExecuteResult = any,
> = {
  description: string;
  parameters: TParamsSchema; // El SDK espera el esquema Zod directamente aquí
  execute: (args: z.infer<TParamsSchema>) => Promise<TExecuteResult>; // La función de ejecución
};

@Injectable()
export class ToolService {
  private readonly logger = new Logger(ToolService.name);
  private readonly registeredTools: Map<ToolName, ToolDefinition<any, any>> =
    new Map();

  constructor() {
    this.registerAvailableTools();
  }

  private registerAvailableTools(): void {
    try {
      for (const toolKey in toolDefinitions) {
        if (Object.prototype.hasOwnProperty.call(toolDefinitions, toolKey)) {
          const toolName = toolKey as ToolName; // Assuming ToolName is a string type, this should be fine.
          const toolDef = toolDefinitions[toolName] as ToolDefinition<any, any>;
          this.registeredTools.set(toolName, toolDef); // TS2352 here is odd if ToolName is string.
          this.logger.log(`Herramienta registrada: ${toolDef.name} ✅`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error al registrar herramientas: ${error.message} ❌`,
        error.stack,
      );
      throw error;
    }
  }

  getToolDefinition(name: ToolName): ToolDefinition<any, any> | undefined {
    return this.registeredTools.get(name);
  }

  // Devuelve las definiciones de herramientas en el formato que el AI SDK espera para 'tools'
  // cuando solo se quieren declarar las herramientas (para que el LLM sepa de ellas).
  // Usado típicamente con `streamText` donde `onToolCall` maneja la ejecución.
  getToolDeclarationsForAI(): Record<
    string,
    { description: string; parameters: ZodSchema }
  > {
    const aiToolDeclarations: Record<
      string,
      { description: string; parameters: ZodSchema }
    > = {};
    this.registeredTools.forEach((tool, name) => {
      aiToolDeclarations[name] = {
        description: tool.description,
        parameters: tool.parametersSchema, // El SDK usa este esquema Zod
      };
    });
    return aiToolDeclarations;
  }

  // Devuelve las herramientas con su función `execute` para que el AI SDK (e.g., `generateText`)
  // pueda manejar el ciclo completo de llamadas a herramientas automáticamente.
  getToolsWithExecuteFunctionForAI(): Record<
    string,
    AIToolSettingsWithExecute<any, any>
  > {
    const aiToolsWithExecute: Record<
      string,
      AIToolSettingsWithExecute<any, any>
    > = {};
    this.registeredTools.forEach((tool, name) => {
      aiToolsWithExecute[name] = {
        description: tool.description,
        parameters: tool.parametersSchema,
        execute: async (args: z.infer<typeof tool.parametersSchema>) => {
          this.logger.debug(
            `AI SDK auto-ejecutando herramienta: ${name} con args: ${JSON.stringify(args)} ⚙️🤖`,
          );
          const result = await tool.execute(args);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return result;
        },
      };
    });
    return aiToolsWithExecute;
  }

  // Ejecuta una herramienta registrada por su nombre con los argumentos proporcionados.
  // Valida los argumentos contra el esquema Zod de la herramienta antes de la ejecución.
  async executeTool(toolName: ToolName, args: unknown): Promise<any> {
    const tool = this.getToolDefinition(toolName);
    if (!tool) {
      this.logger.error(
        `Intento de ejecutar herramienta desconocida: ${toolName} ❓`,
      );
      throw new NotFoundException(
        `Herramienta "${toolName}" no encontrada o no registrada.`,
      );
    }

    try {
      // Validar los argumentos contra el esquema Zod de la herramienta
      const validatedArgs = tool.parametersSchema.parse(args);
      this.logger.log(
        `Ejecutando herramienta "${toolName}" con args validados: ${JSON.stringify(validatedArgs)} ⚙️✔️`,
      );

      const result = await tool.execute(validatedArgs);
      this.logger.log(
        `Herramienta "${toolName}" ejecutada exitosamente. Resultado crudo: ${JSON.stringify(result)} ✨🎉`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error ejecutando herramienta "${toolName}": ${error.message} 💥`,
        error.stack,
      );
      if (error instanceof z.ZodError) {
        // Si la validación de Zod falla, lanza un error descriptivo.
        throw new Error(
          `Argumentos inválidos para la herramienta ${toolName}: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')} ❌`,
        );
      }
      // Re-lanzar otros errores para que sean manejados por el código que llama a este método.
      throw error;
    }
  }
}
