import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ToolModule } from '../tool/tool.module';
import { InferenceService } from './inference.service';

@Module({
  imports: [ConfigModule, ToolModule],
  providers: [InferenceService],
  exports: [InferenceService],
})
export class InferenceModule {}
