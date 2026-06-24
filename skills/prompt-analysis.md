# Skill: Prompt Analysis

## Purpose

This skill is for learning how prompts shape AI Agent behavior. It helps break down a prompt into layers, identify which instruction affects which behavior, and suggest clearer prompt variants for study.

This is not a production prompt-optimization workflow. The goal is understanding.

## When To Use

Use this skill when you want to analyze:

- Why an Agent chose a certain action
- How system, developer, user, and tool instructions interact
- Which prompt sentence created a behavior constraint
- How to make a prompt easier to inspect and debug

## Analysis Structure

### 1. Prompt Layer Breakdown

Separate the prompt into these layers when visible:

- System prompt: global identity, safety, behavior, tool policy, formatting rules
- Developer prompt: project-specific or environment-specific constraints
- User prompt: current task, desired output, explicit constraints
- Tool prompt: schemas, tool descriptions, tool usage restrictions
- Retrieved context: files, docs, memories, prior summaries, search results

If a layer is not visible, mark it as `not available` rather than guessing.

### 2. Instruction Intent

For each important instruction, explain:

- What behavior it asks for
- Whether it is a hard constraint or soft preference
- Whether it affects planning, tool use, file editing, output format, or safety
- Whether it conflicts with another instruction

Example:

```text
Instruction: "Do not refactor project structure."
Effect: Limits edits to learning documents only.
Behavior impact: Prevents broad code cleanup or file movement.
```

### 3. Agent Behavior Impact

Map prompt fragments to likely Agent behavior:

- Tool usage: when the Agent should inspect files, run commands, browse, or avoid tools
- Reasoning path: whether the Agent should plan, compare options, or execute directly
- Output shape: required headings, bullets, code blocks, diagrams, or summaries
- Risk handling: when to ask clarification, stop, or proceed conservatively

### 4. Prompt Debugging Questions

Use these questions while learning:

- What did the Agent know before reading files?
- Which instruction forced the Agent to use or avoid tools?
- Which instruction controlled the final answer format?
- Did any instruction create ambiguity?
- Did the prompt define the success condition clearly?

### 5. Learning-Oriented Optimization

When suggesting improvements, focus on clarity:

- Move goal and success condition near the top
- Separate hard constraints from preferences
- List allowed and forbidden actions explicitly
- Define expected output format with a small example
- Keep learning prompts inspectable rather than clever

## Output Template

```markdown
## Prompt Layer Breakdown

## Key Instructions And Effects

## Behavior Map

## Ambiguities Or Conflicts

## Learning-Oriented Prompt Improvements
```

