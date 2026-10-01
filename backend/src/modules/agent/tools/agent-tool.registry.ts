import { Injectable } from '@nestjs/common';

import { SearchDoctorsTool } from './search-doctors.tool';
import { SearchHospitalsTool } from './search-hospitals.tool';
import { AgentTool } from './interfaces/agent-tool.interface';


@Injectable()
export class AgentToolRegistry {
  private readonly tools: Map<string, AgentTool>;

  constructor(
    private readonly searchDoctorsTool: SearchDoctorsTool,
    private readonly searchHospitalsTool: SearchHospitalsTool,
  ) {
    this.tools = new Map<string, AgentTool>([
      ['search_doctors', searchDoctorsTool],
      ['search_hospitals', searchHospitalsTool],
    ]);
  }

  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}