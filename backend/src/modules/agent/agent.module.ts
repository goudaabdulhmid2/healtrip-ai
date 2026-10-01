import { Module } from '@nestjs/common';
import { AgentToolsModule } from './tools/agent-tools.module';
import { AgentService } from './agent.service';

@Module({
  imports: [AgentToolsModule],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}