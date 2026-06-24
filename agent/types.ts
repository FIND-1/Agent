export type OutputFormat = "json" | "text";

export interface SkillDocument {
  name: string;
  path: string;
  content: string;
}

export interface AgentPrompt {
  skillsContext: string;
  task: string;
  outputFormat: "JSON or text";
}

export interface ExecutionResult {
  runtime: "node";
  outputFormat: OutputFormat;
  output: string;
  createdAt: string;
}

export interface ExecutionTrace {
  inputTask: string;
  loadedSkillsList: string[];
  finalPrompt: AgentPrompt;
  executionResult: ExecutionResult;
}

