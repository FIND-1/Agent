# Output Parser Practice (MySQL + Streaming)

## Goal

Learn the full structured-output flow:

LLM -> structured output -> data consumption pipeline (DB / JSON / API)

---

## Core Flow

LLM
 -> withStructuredOutput
 -> Zod Schema
 -> Structured JSON
 -> Data Sink (MySQL / JSON / SQLite)

---

## What This Lesson Is Really About

MySQL is only one possible storage target for structured data.

The main focus is the pipeline itself, not MySQL specifically.

---

## TODO

### Data sink improvements

- [ ] JSON file storage (recommended default)
- [ ] SQLite (lightweight database)
- [ ] MySQL (verification only)

### Extension ideas

- [ ] Integrate a REST API
- [ ] Integrate a vector database
- [ ] Support batch ingestion

---

## Review Points

- How `withStructuredOutput` constrains model output
- How to define structure with Zod schema
- How structured output flows into downstream storage

---

## Workspace Dependency Rules

This project uses a `pnpm` workspace. Lesson directories normally reuse the root `node_modules` and the packages declared in the root `package.json`.

When adding a shared dependency, install it at the workspace root first:

```powershell
cd D:\1project\agent
pnpm add -w <package-name>
```

Example:

```powershell
pnpm add -w @zilliz/milvus2-sdk-node
```

Only install a dependency into a specific lesson `package.json` when that lesson truly needs its own isolated version or package set.
