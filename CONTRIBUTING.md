# Contributing

Issues and pull requests are welcome. This repository favors small, runnable learning examples over framework-scale abstractions.

## Requirements

- Node.js 22
- pnpm 11

## Setup

```bash
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env` only when working on a model-backed lesson. Never commit credentials.

## Development and validation

Run the root TypeScript check:

```bash
pnpm typecheck
```

Run the local root demo:

```bash
pnpm agent:demo -- "Describe this task"
```

Individual lessons may define their own checks, tests, or builds. Read the lesson README and `package.json` before running it. Do not report an external-service example as verified unless the required service was actually available.

## Issues

When opening an issue, include the lesson or file, expected behavior, actual behavior, Node and pnpm versions, and a minimal reproduction. Redact keys, tokens, passwords, and private endpoint details.

## Pull requests

Keep changes focused, explain which example or behavior they affect, and include the validation commands you ran. Preserve existing examples unless the pull request explicitly documents a migration.
