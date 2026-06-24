# Skill: File Structure Analyzer

## Purpose

This skill analyzes the current project directory structure so you can understand how an Agent system is organized.

It focuses on learning architecture boundaries:

- prompt layer
- agent layer
- tool layer
- RAG layer
- runtime layer
- examples and tests

Do not restructure files as part of this skill.

## When To Use

Use this skill when you want to understand:

- Where prompts live
- Where Agent orchestration lives
- Where tools are defined
- Whether a RAG pipeline exists
- Which folders are examples, experiments, or runtime demos
- How to navigate the FIND-1 Agent project step by step

## Analysis Method

### 1. Scan Top-Level Directories

Start with the project root:

```text
/
  package.json
  README.md
  skills/
  ...
```

Classify each folder as:

- app or demo
- prompt resources
- Agent implementation
- tool examples
- RAG examples
- memory examples
- runtime scripts
- docs

### 2. Identify Prompt Layer

Look for:

- prompt files
- system instruction files
- Markdown task templates
- config that controls model messages
- examples of user prompts

Prompt layer answers:

```text
What instructions shape Agent behavior?
```

### 3. Identify Agent Layer

Look for:

- Agent classes
- orchestration scripts
- loops
- planner / executor code
- task runners
- model client wrappers

Agent layer answers:

```text
Who decides the next action?
```

### 4. Identify Tool Layer

Look for:

- tool definitions
- MCP route docs
- function schemas
- wrappers around file system, search, shell, API, browser, or database calls

Tool layer answers:

```text
What can the Agent do outside the model?
```

### 5. Identify RAG Layer

If present, look for:

- document loading
- chunking
- embeddings
- vector database
- retrieval
- context assembly

RAG layer answers:

```text
How does the Agent retrieve external knowledge?
```

If no RAG layer exists, write:

```text
RAG layer: not found in current scan.
```

### 6. Identify Runtime Layer

Look for:

- Node entry points
- package scripts
- environment variables
- CLI scripts
- server startup files

Runtime layer answers:

```text
How does the system start and execute?
```

## Output Template

```markdown
## Project Structure Summary

## Prompt Layer

## Agent Layer

## Tool Layer

## RAG Layer

## Runtime Layer

## Suggested Reading Path
```

## Suggested Reading Path

For learning, inspect in this order:

1. `README.md`
2. `package.json`
3. folders that mention tool, agent, rag, memory, or cursor
4. entry files such as `index.js`, `server.js`, or `scripts/*`
5. prompt/config files
6. logs or example outputs

