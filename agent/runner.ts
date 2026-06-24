import { appendFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createPrompt } from "./prompt.ts";
import type { AgentPrompt, ExecutionResult, ExecutionTrace, SkillDocument } from "./types.ts";

type SkillsGlobal = typeof globalThis & {
  __LIGHTWEIGHT_AGENT_SKILLS_CONTEXT__?: string;
};

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);
const projectRoot = resolve(currentDir, "..");
const skillsDir = join(projectRoot, "skills");
const outputDir = join(projectRoot, "output");
const tracePath = join(outputDir, "trace.json");
const logsPath = join(outputDir, "logs.md");

export async function loadSkills(): Promise<SkillDocument[]> {
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const markdownFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  return Promise.all(
    markdownFiles.map(async (name) => {
      const path = join(skillsDir, name);
      const content = await readFile(path, "utf8");

      return {
        name,
        path,
        content,
      };
    }),
  );
}

function mergeSkillsContext(skills: SkillDocument[]): string {
  return skills
    .map((skill) => [`# Skill File: ${skill.name}`, skill.content].join("\n\n"))
    .join("\n\n---\n\n");
}

async function executeWithNodeRuntime(prompt: AgentPrompt): Promise<ExecutionResult> {
  const result = {
    purpose: "lightweight-agent-learning-run",
    task: prompt.task,
    skillsContextCharacters: prompt.skillsContext.length,
    observation:
      "Skills were automatically loaded and injected before the task reached the runtime step.",
  };

  return {
    runtime: "node",
    outputFormat: "json",
    output: JSON.stringify(result, null, 2),
    createdAt: new Date().toISOString(),
  };
}

async function writeTrace(trace: ExecutionTrace): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await writeFile(tracePath, `${JSON.stringify(trace, null, 2)}\n`, "utf8");

  const logEntry = [
    `## ${trace.executionResult.createdAt}`,
    "",
    `- task: ${trace.inputTask}`,
    `- loaded skills: ${trace.loadedSkillsList.join(", ") || "none"}`,
    `- runtime: ${trace.executionResult.runtime}`,
    `- output format: ${trace.executionResult.outputFormat}`,
    "",
  ].join("\n");

  await appendFile(logsPath, logEntry, "utf8");
}

export async function run(task: string): Promise<ExecutionTrace> {
  const skills = await loadSkills();
  const skillsContext = mergeSkillsContext(skills);

  (globalThis as SkillsGlobal).__LIGHTWEIGHT_AGENT_SKILLS_CONTEXT__ = skillsContext;

  const finalPrompt = createPrompt(task);
  const executionResult = await executeWithNodeRuntime(finalPrompt);
  const trace: ExecutionTrace = {
    inputTask: task,
    loadedSkillsList: skills.map((skill) => skill.name),
    finalPrompt,
    executionResult,
  };

  await writeTrace(trace);
  console.log(executionResult.output);

  return trace;
}

const cliTask = process.argv.slice(2).join(" ").trim();

if (cliTask) {
  run(cliTask).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
