# Skill: Execution Trace

## Purpose

This skill is for recording and explaining an Agent execution chain. It turns an Agent run into a readable trace so you can understand how input becomes output through reasoning, tool calls, runtime behavior, and file changes.

The goal is learning and debugging, not performance tuning.

## When To Use

Use this skill when you want to understand:

- Why the Agent called a specific tool
- What files or commands influenced the result
- Where an execution path changed direction
- How input, reasoning, tool calls, and output connect
- How to reproduce or explain an Agent run

## Trace Model

Record the flow as:

```text
input -> interpretation -> plan -> tool call -> observation -> decision -> output
```

For coding tasks, extend the flow:

```text
input -> repo scan -> file read -> edit -> verification -> final response
```

For Node.js Agent tasks, extend the flow:

```text
input -> runtime startup -> prompt assembly -> model call -> tool dispatch -> tool result -> response
```

## What To Record

### 1. Input

- User request
- Important constraints
- Expected output
- Files or context explicitly mentioned

### 2. Reasoning Summary

Do not expose hidden chain-of-thought. Record a concise external summary:

- What the Agent inferred
- What decision it made
- Why the next step was useful

Example:

```text
Reasoning summary: The request asks for learning documents only, so the Agent inspected the project root and created Markdown files without touching business code.
```

### 3. Tool Calls

For each tool call, record:

- Tool or command
- Purpose
- Key result
- How the result changed the next step

### 4. Output

Record:

- Files created or changed
- Final answer shape
- Verification performed
- Known gaps or assumptions

## Text Flow Diagram

Use a simple text diagram:

```text
[User Request]
      |
      v
[Interpret task constraints]
      |
      v
[Inspect workspace]
      |
      v
[Create learning files]
      |
      v
[Verify files exist]
      |
      v
[Final summary]
```

## Output Template

```markdown
## Execution Trace

### Input

### Interpretation

### Tool Calls

### Observations

### Decisions

### Output

### Flow Diagram
```

