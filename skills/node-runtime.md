# Skill: Node Runtime

## Purpose

This skill explains how Node.js runtime behavior drives an AI Agent in this project. It focuses on process startup, script execution, environment variables, logs, and tool/runtime boundaries.

The goal is to understand runtime behavior, not to productionize deployment.

## Common Commands

Run a plain JavaScript entry point:

```bash
node index.js
```

Run TypeScript scripts when `ts-node` is available:

```bash
ts-node scripts/*
```

Run package scripts if the project defines them:

```bash
pnpm run <script>
npm run <script>
```

Inspect available scripts:

```bash
cat package.json
```

On Windows PowerShell:

```powershell
Get-Content package.json
```

## Runtime Concepts

### 1. Process Startup

Node starts from an entry file such as:

- `index.js`
- `src/index.js`
- `server.js`
- `scripts/*.js`
- `scripts/*.ts`

The entry file usually loads config, creates clients, assembles prompts, then runs the Agent loop or a single task.

### 2. Environment Variables

Agent demos often depend on variables such as:

- API keys
- model names
- base URLs
- vector database config
- tracing flags

Learning question:

```text
Which values come from code, and which values come from the runtime environment?
```

### 3. Runtime Drives Agent Behavior

A common Node Agent flow:

```text
node index.js
  -> load env/config
  -> load prompt or task input
  -> create model/client
  -> register tools
  -> call model
  -> parse tool call
  -> execute tool
  -> feed result back
  -> print final answer
```

### 4. Reading Execution Logs

When reading logs, separate:

- Startup logs: config loaded, server started, clients created
- Prompt logs: final prompt, messages, system/user/tool roles
- Model logs: request sent, response received, token or usage data
- Tool logs: tool name, arguments, result, errors
- Runtime errors: missing env, module import errors, network failures

### 5. Common Runtime Errors

```text
MODULE_NOT_FOUND
```

Usually means dependency or import path issue.

```text
SyntaxError: Cannot use import statement outside a module
```

Usually means ESM / CommonJS mismatch.

```text
process.env.X is undefined
```

Usually means required environment variable is missing.

```text
ECONNREFUSED or ETIMEDOUT
```

Usually means network, service endpoint, or local server issue.

## Output Template

```markdown
## How To Run

## Runtime Flow

## Environment Variables

## Logs To Read

## Common Errors

## What To Inspect Next
```

