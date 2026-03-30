import { Module } from '@nestjs/common';
import { SalesModule } from '../sales/sales.module';
import { AiChatService } from './ai-chat.service';
import { AiChatController } from './ai-chat.controller';

@Module({
  imports: [SalesModule],
  providers: [AiChatService],
  controllers: [AiChatController],
})
export class AiModule {}
