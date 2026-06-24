Before explaining code, assume Code Generation Policy (Ponytail Mode) will be applied during any modification decisions.

# Skill: Code Explainer

## Purpose

This skill explains existing code in natural language. It is designed to help understand the current project, especially Agent, tool, runtime, and RAG interactions.

It is not a refactoring skill. Do not change code unless explicitly requested.

## When To Use

Use this skill when you want to understand:

- What a file or module does
- How functions connect to each other
- Where Agent logic calls tools
- Where runtime behavior starts
- How data moves through a script or workflow

## Explanation Method

### 1. File Role

Start by identifying the file's role:

- Entry point
- Agent orchestration
- Tool definition
- Runtime helper
- Prompt or config
- RAG pipeline
- Test or example

### 2. Key Functions

For each important function, explain:

- What it receives
- What it returns or changes
- What side effects it has
- Whether it calls tools, model APIs, file IO, network, or runtime APIs

Example:

```text
main()
- Starts the script.
- Loads environment variables.
- Creates a client.
- Calls the Agent or tool workflow.
- Prints or writes the result.
```

### 3. Agent / Tool / Runtime Interaction Points

Mark interaction points explicitly:

- Agent -> model call
- Agent -> tool dispatch
- Tool -> external API
- Tool -> file system
- Runtime -> process startup
- Runtime -> environment variable
- RAG -> embedding
- RAG -> vector search
- RAG -> context assembly

### 4. Data Flow

Describe the main data path:

```text
user input -> prompt -> model -> tool call -> tool result -> final response
```

For RAG:

```text
query -> embedding -> vector search -> retrieved docs -> prompt context -> answer
```

### 5. Learning Notes

End with learning notes:

- What concept this code demonstrates
- What to inspect next
- Which logs or outputs help verify behavior

## Output Template

```markdown
## File Role

## Main Flow

## Key Functions

## Agent / Tool / Runtime Interaction Points

## Data Flow

## Learning Notes
```

