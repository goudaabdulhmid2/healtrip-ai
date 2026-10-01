export interface AgentTool {
  execute(input: unknown): Promise<unknown>;
}