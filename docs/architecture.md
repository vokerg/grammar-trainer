# Architecture

## Package boundaries

```text
apps/web → packages/shared
apps/api → packages/shared, packages/llm, packages/config, Prisma repositories
packages/llm → packages/shared
packages/shared → no app dependencies
```

Fastify routes validate HTTP input and delegate to services. Services implement use cases through repository interfaces. Prisma-specific behavior stays in repository implementations. External LLM calls happen outside database transactions.

## Submission flow

```text
POST /api/submissions
→ validate request
→ persist Submission
→ create pending Analysis
→ call configured LLM
→ parse JSON and validate with Zod
→ semantic-check trainable mistakes/options
→ transactionally save Analysis, Mistakes, TrainingItems
→ return frontend-safe result
```

On provider, parsing, or validation failure, keep the submission, mark the analysis failed, and return IDs for retry. A retry creates a new analysis attempt so previous failures remain visible.

## Training flow

```text
GET session
→ select active items by priority
→ reconstruct original/correct/two distractors
→ verify normalized uniqueness
→ Fisher-Yates shuffle
→ omit correct-answer metadata

POST answer
→ reconstruct allowed options
→ reject unknown option
→ compare normalized selection
→ record attempt and update statistics transactionally
```

## Common extensions

### Add a language

Update shared supported-language constants and locale mapping, then add UI labels/tests. Do not add language-specific normalization outside the shared helper.

### Add an LLM provider

Implement `LanguageModelProvider` in `packages/llm`, add it to the factory/config schema, and test parsing/error behavior. Do not add persistence to the provider.

### Add an API endpoint

Define shared request/response schemas, add a service when business logic is involved, then add a thin route and typed web client method.

### Change the database

Keep repository contracts stable, update Prisma datasource/schema/migrations and repository implementations, then rerun integration tests.

### Add a mistake category

Update the shared schema, Prisma enum/mapping, prompts, rendering, and tests together.

### Add a training exercise type

Create an explicit domain/API type rather than overloading the existing four-option word/expression item.