import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './modules/chat/chat.module';
import { InferenceModule } from './modules/inference/inference.module';
import { ToolModule } from './modules/tool/tool.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    InferenceModule,
    ToolModule,
    ChatModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
