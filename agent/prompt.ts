import type { AgentPrompt } from "./types.ts";

type SkillsGlobal = typeof globalThis & {
  __LIGHTWEIGHT_AGENT_SKILLS_CONTEXT__?: string;
};

export function createPrompt(task: string): AgentPrompt {
  const skillsContext =
    (globalThis as SkillsGlobal).__LIGHTWEIGHT_AGENT_SKILLS_CONTEXT__ ?? "";

  return {
    skillsContext,
    task,
    outputFormat: "JSON or text",
  };
}
