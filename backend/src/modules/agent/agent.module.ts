import { Module } from '@nestjs/common';

import { AgentService } from './agent.service';
import { LLM_PROVIDER } from './interfaces/llm-provider.token';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { AgentToolsModule } from './tools/agent-tools.module';
import { SafetyGuard } from './safety/safety.guard';

@Module({
  imports: [AgentToolsModule],

  providers: [
    AgentService,
    SafetyGuard,

    {
      provide: LLM_PROVIDER,
      useClass: OpenRouterProvider,
    },
  ],

  exports: [AgentService],
})
export class AgentModule {}