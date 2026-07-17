# Agent Guide

Start with:

1. `README.md` for setup and commands.
2. `.github/copilot-instructions.md` for non-negotiable rules.
3. `docs/architecture.md` for flows and extension points.
4. `docs/domain-rules.md` for trainability, normalization, privacy, and answer secrecy.

## Working agreement

- Make focused changes on a branch.
- Reuse shared Zod contracts and normalization.
- Keep routes thin, services responsible for use cases, Prisma inside repositories, and provider code inside `packages/llm`.
- Preserve submissions across analysis failures.
- Never trust LLM output or leak correct answers before an attempt.
- Add or update tests with behavior changes.

## Validate before completion

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm format:check
pnpm build
pnpm -r lint
pnpm -r typecheck
pnpm -r test
```

Use the mock provider for deterministic development and CI. Do not require a live external model unless the task specifically concerns provider integration.