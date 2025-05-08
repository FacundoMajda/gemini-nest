import { Module } from '@nestjs/common';
import { InferenceModule } from '../inference/inference.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [InferenceModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
