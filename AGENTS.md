# Repository Guidelines

Grammar Trainer is a local-first literacy app. Learners submit text, receive supportive grammar and style feedback from a configurable LLM, and practise suitable mistakes as four-option contextual exercises.

## Project Structure

- `apps/web`: React UI, routes, API clients, and translations.
- `apps/api`: Fastify routes, application services, domain logic, and Prisma repositories.
- `packages/shared`: shared Zod contracts, enums, types, and normalization.
- `packages/llm`: provider interfaces, prompts, parsing, and provider adapters.
- `packages/config`: safe provider and environment configuration helpers.
- `prisma`: SQLite schema and migrations.

Routes validate HTTP input and delegate to services. Services own use cases and depend on repository interfaces. Keep Prisma in repository implementations and provider behavior in `packages/llm`; the LLM package must not depend on Prisma.

## Core Rules

- Persist a learner submission before any LLM call. Analysis failures must preserve it and remain retryable.
- Treat LLM output as untrusted: parse JSON, validate with shared Zod schemas, then apply semantic validation.
- Define API contracts and comparison normalization in `packages/shared`; do not duplicate DTOs or normalization in apps.
- Never expose secrets, prompts, raw provider errors, or correct-answer metadata before an attempt.
- Create training items only from valid mistakes whose four contextual options are unique after shared normalization. Keep display values, and persist a clear reason when a mistake is not trainable.
- Keep learner-facing text in `apps/web/src/i18n.tsx` for Danish, English, German, and Russian.
- Add or update tests whenever behavior changes. Use strict TypeScript and avoid `any`.

## Task-Specific Context

Read `README.md` for setup, commands, and provider configuration. Read `docs/architecture.md` when changing flows, package boundaries, endpoints, providers, or persistence. Read `docs/domain-rules.md` when changing analysis, trainability, normalization, privacy, feedback, or answer handling.

## Validation

Run `pnpm install --frozen-lockfile` for initial setup or dependency changes, and `pnpm db:generate` after Prisma client or schema changes. Before completion, run:

```bash
pnpm format:check
pnpm build
pnpm -r lint
pnpm -r typecheck
pnpm -r test
```

Use the mock provider for deterministic development and CI. Require a live model only for provider-integration work.
