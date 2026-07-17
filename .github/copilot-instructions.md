# Copilot Instructions

## Product

Grammar Trainer is a local-first literacy app. A learner submits text, receives supportive grammar/style feedback from a configurable LLM, and practises suitable mistakes as four-option contextual exercises.

## Architecture

- `apps/web`: React UI and translations.
- `apps/api`: Fastify routes and application services.
- `packages/shared`: shared Zod contracts, enums, types, normalization.
- `packages/llm`: provider interface, prompts, parsing, mock and OpenAI-compatible adapters.
- `packages/config`: safe provider/config helpers.
- `prisma`: schema and migrations.

Dependency direction: routes → services → repository interfaces. Prisma stays in repository implementations. The LLM package must not depend on Prisma.

## Non-negotiable rules

1. Persist the learner submission before calling any LLM.
2. Treat all LLM output as untrusted: JSON parse, Zod validate, then semantic validate.
3. Keep API contracts in `packages/shared`; do not redefine DTOs in apps.
4. Never expose API keys, raw provider errors, prompts, or correct training answers before submission.
5. Do not create training items from every correction.
6. Training options are complete short sentences or meaningful word sequences with the same context.
7. Capitalization is excluded from the current training type. Punctuation is allowed only with four clear contextual sentence variants.
8. The four options must be unique after shared normalization.
9. Normalize for comparison/deduplication but preserve display values.
10. Deduplicate by language + normalized original correction fragment + normalized correct fragment.
11. A failed analysis must preserve the submission and remain retryable.
12. Keep feedback supportive, age-appropriate, and in the requested language.
13. Send only submitted text, requested language, and instructions to the provider.
14. Supported UI/writing languages are `da`, `en`, `de`, and `ru`; keep every learner-facing label in `apps/web/src/i18n.tsx`.
15. Persist and display a clear reason when a mistake is not added to training.

## Where changes belong

| Change                      | Location                                     |
| --------------------------- | -------------------------------------------- |
| API schema/type             | `packages/shared`                            |
| LLM provider/prompt/parsing | `packages/llm`                               |
| Persistence/query           | API repository layer + Prisma                |
| Use-case behavior           | `apps/api/src/services`                      |
| HTTP validation/status      | `apps/api/src/routes`                        |
| Frontend requests           | `apps/web/src/api`                           |
| UI behavior/translations    | `apps/web/src/routes`, `components`, `i18n`  |

## Development rules

- Use strict TypeScript; avoid `any` and duplicated contracts.
- Keep route handlers thin and business logic out of React components.
- Update tests for changed behavior.
- Prefer the smallest extensible implementation; do not add deferred features without a request.

## Required checks

```bash
pnpm format:check
pnpm build
pnpm -r lint
pnpm -r typecheck
pnpm -r test
```

Read `docs/architecture.md` and `docs/domain-rules.md` before changing core flows.
