import { ToolCallPart as VercelToolCallPart } from 'ai';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];
}

class MessageContentPartTextDto {
  @IsIn(['text'])
  type: 'text';
  @IsString()
  text: string;
}
class MessageContentPartToolCallDto {
  @IsIn(['tool-call'])
  type: 'tool-call';
  @IsString()
  toolCallId: string;
  @IsString()
  toolName: string;
  @IsObject()
  args: any;
}

export class MessageDto {
  @IsIn(['user', 'assistant', 'system', 'tool'])
  role: 'user' | 'assistant' | 'system' | 'tool';

  @IsOptional()
  content:
    | string
    | Array<MessageContentPartTextDto | MessageContentPartToolCallDto>;

  @IsOptional()
  @IsString()
  tool_call_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  tool_calls?: VercelToolCallPart[];
}

export class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @IsOptional()
  @IsString()
  systemPrompt?: string;
}
