import { Module } from '@nestjs/common';
import { SalesModule } from '../sales/sales.module';
import { AiChatService } from './ai-chat.service';
import { AiChatController } from './ai-chat.controller';
import { AiPromptBuilderService } from './ai-prompt-builder.service';
import { AiCatalogContextService } from './ai-catalog-context.service';
import { AiFallbackService } from './ai-fallback.service';

@Module({
  imports: [SalesModule],
  providers: [
    AiChatService,
    AiPromptBuilderService,
    AiCatalogContextService,
    AiFallbackService,
  ],
  controllers: [AiChatController],
})
export class AiModule {}
