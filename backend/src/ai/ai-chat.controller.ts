import { Body, Controller, Post } from '@nestjs/common';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';
import { AiChatService } from './ai-chat.service';

class AiChatHistoryItemDto {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  text: string;
}

class AiChatRequestDto {
  @IsString()
  @MinLength(1)
  message: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsArray()
  history?: AiChatHistoryItemDto[];
}

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('respond')
  async respond(
    @Body() body: AiChatRequestDto,
  ): Promise<{ answer: string; suggestions: string[] }> {
    return this.aiChatService.reply(
      body.message,
      body.history ?? [],
      body.language,
    );
  }

  /** Grounded overview of this codebase/store for the product-page modal. */
  @Post('project-info')
  async projectInfo(): Promise<{
    answer: string;
    provider: 'openai' | 'gemini' | 'static';
    model?: string;
    note?:
      | 'missing_openai_used_gemini'
      | 'openai_failed_used_gemini'
      | 'no_ai_available';
  }> {
    return this.aiChatService.projectOverview();
  }
}
