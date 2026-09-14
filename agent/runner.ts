import {
  appendFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createPrompt } from "./prompt.ts";
import {
  finishTrace,
  redactSensitiveText,
  startSpan,
  startTrace,
} from "./observability.ts";
import type {
  AgentPrompt,
  ExecutionResult,
  ExecutionTrace,
  SkillDocument,
} from "./types.ts";

type SkillsGlobal = typeof globalThis & {
  __LIGHTWEIGHT_AGENT_SKILLS_CONTEXT__?: string;
};

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);
const projectRoot = resolve(currentDir, "..");
const skillsDir = join(projectRoot, "skills");
const outputDir = process.env.AGENT_OUTPUT_DIR
  ? resolve(process.env.AGENT_OUTPUT_DIR)
  : join(projectRoot, "output");
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

async function executeWithNodeRuntime(
  prompt: AgentPrompt,
): Promise<ExecutionResult> {
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
  const traceContext = startTrace(task);

  try {
    const skillSpan = startSpan(traceContext, "load-skills", {
      directory: "skills",
    });
    const skills = await loadSkills();
    skillSpan?.end({
      output: {
        count: skills.length,
        names: skills.map((skill) => skill.name),
      },
    });

    const skillsContext = mergeSkillsContext(skills);

    (globalThis as SkillsGlobal).__LIGHTWEIGHT_AGENT_SKILLS_CONTEXT__ =
      skillsContext;

    const promptSpan = startSpan(traceContext, "build-agent-prompt", {
      task: redactSensitiveText(task),
      skillCount: skills.length,
    });
    const finalPrompt = createPrompt(task);
    promptSpan?.end({
      output: {
        outputFormat: finalPrompt.outputFormat,
        skillsContextCharacters: finalPrompt.skillsContext.length,
      },
    });

    const execution = startSpan(traceContext, "deterministic-agent-runtime", {
      task: redactSensitiveText(task),
      outputFormat: finalPrompt.outputFormat,
    });
    const executionResult = await executeWithNodeRuntime(finalPrompt);
    const tracedExecutionOutput = JSON.parse(executionResult.output) as {
      task?: string;
      [key: string]: unknown;
    };
    if (tracedExecutionOutput.task) {
      tracedExecutionOutput.task = redactSensitiveText(tracedExecutionOutput.task);
    }
    execution?.end({ output: tracedExecutionOutput });
    const trace: ExecutionTrace = {
      inputTask: task,
      loadedSkillsList: skills.map((skill) => skill.name),
      finalPrompt,
      executionResult,
    };

    await writeTrace(trace);
    finishTrace(traceContext, {
      runtime: executionResult.runtime,
      outputFormat: executionResult.outputFormat,
      output: tracedExecutionOutput,
    });
    console.log(executionResult.output);

    return trace;
  } catch (error) {
    finishTrace(traceContext, undefined, error);
    throw error;
  } finally {
    await traceContext.flush();
  }
}

const cliTask = process.argv.slice(2).join(" ").trim();

if (cliTask) {
  run(cliTask).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
