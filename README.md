# Grammar Trainer

A local-first literacy writing and training application. A learner writes a short text, receives supportive grammar and style feedback from a configurable language model, and practises suitable mistakes as four-option exercises.

## What is included

- React + Vite web app with writing, result, training, and history routes.
- Fastify REST API with Zod-validated contracts.
- Prisma repository layer backed by a local SQLite file.
- Provider-independent LLM package with deterministic mock and OpenAI-compatible adapters.
- Strict JSON parsing, one repair attempt, and semantic validation before mistakes can become training items.
- Server-side option shuffling and answer validation without leaking the correct answer.
- Submission persistence before model calls, failed-analysis history, and retry support.
- Vitest unit, integration, and component tests.
- GitHub Actions validation and build artifacts.

## Architecture

```text
apps/web        React user interface
apps/api        Fastify API and application services
packages/shared Shared Zod API/domain contracts and normalization
packages/llm    LLM interfaces, prompts, parsing, mock and HTTP adapters
packages/config Shared provider configuration helpers
prisma          SQLite schema and migrations
```

The API route handlers depend on application services. Services use repository interfaces through a Prisma-backed repository context, and the LLM layer has no database dependency. This keeps PostgreSQL and additional model providers practical future changes.

## Coding-agent documentation

- [`AGENTS.md`](AGENTS.md): entry point for coding agents.
- [Copilot instructions](.github/copilot-instructions.md): mandatory implementation rules.
- [Architecture guide](docs/architecture.md): flows, boundaries, and extension recipes.
- [Domain rules](docs/domain-rules.md): training, normalization, privacy, and LLM invariants.

## Requirements

- Node.js 22 or newer
- pnpm 10

Enable pnpm through Corepack when needed:

```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
```

## Local setup

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

The API loads the root `.env` file automatically in both development and production. Keep it local: it is ignored by Git.

The web app runs at `http://localhost:5173` and the API at `http://localhost:3001` by default.

The root `dev` command builds internal workspace packages first so their production exports exist, then starts the API and web development servers together.

## Default provider: DeepSeek

`pnpm dev` reads the root `.env` file. The example configuration uses DeepSeek's
OpenAI-compatible API, so add your API key after copying it:

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-v4-flash
LLM_API_KEY=your-deepseek-api-key
LLM_REASONING_EFFORT=
LLM_THINKING_MODE=disabled
```

`pnpm dev:deepseek` remains available as an alias for `pnpm dev`.

## Mock provider

For deterministic, offline development and tests, set:

```env
LLM_PROVIDER=mock
MOCK_LLM_MODE=success
```

The mock provider recognises a small deterministic development case such as `interesant` and can also simulate:

```text
success
no-mistakes
invalid-json
timeout
provider-error
```

## Local Qwen through Ollama

Run the local Qwen profile with:

```bash
cp .env.qwen.example .env.qwen
pnpm dev:qwen
```

It loads the ignored `.env.qwen` file. The example is preconfigured for Ollama;
update `LLM_MODEL` to the exact identifier from `ollama list` if yours differs.

## Another OpenAI-compatible server

Set the URL to the endpoint exposed by your chosen inference server:

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=your-model
LLM_API_KEY=
```

Reasoning is disabled by default with `LLM_REASONING_EFFORT=none`. For a thinking-capable model, set it to `low`, `medium`, or `high` only when the task benefits from extra reasoning.

For local troubleshooting, set `LLM_DEBUG_LOGGING=true`. This logs each request's endpoint, model, payload, response, status, and duration. It includes learner text and model output, so leave it off outside a private development environment.

The adapter calls `POST {LLM_BASE_URL}/chat/completions`. The API key is optional because many local servers do not require one. Ports and model names differ between Ollama, llama.cpp servers, vLLM, LM Studio, and other runtimes, so use the base URL and model identifier shown by that server.

## Hosted OpenAI-compatible endpoint

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://your-provider.example/v1
LLM_MODEL=your-model
LLM_API_KEY=your-secret
```

Secrets remain server-side and are never included in `/api/config`. The UI labels the provider as local only when the hostname is a recognised local address (or the mock provider is active).

## Database

The default database is a SQLite file configured by:

```env
DATABASE_URL=file:./dev.db
```

Useful commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
```

Submissions and pending analyses are created before any external model request. A failed model call therefore leaves the learner's text available for retry.

## Validation and tests

```bash
pnpm format:check
pnpm build
pnpm -r lint
pnpm -r typecheck
pnpm -r test
```

The API integration suite creates a disposable SQLite database, resets it between tests, and covers successful analysis, failure preservation, retry, deduplication, answer secrecy, answer recording, and invalid options.

## API overview

```text
GET    /api/health
GET    /api/config
POST   /api/submissions
GET    /api/submissions
GET    /api/submissions/:submissionId
POST   /api/submissions/:submissionId/analyze
GET    /api/training/session
POST   /api/training/items/:trainingItemId/answer
GET    /api/training/stats
```

## Privacy notes

Only the submitted text, requested language, and analysis instructions are sent to the configured model. The API does not log complete learner text, raw model responses, authorization headers, or API keys by default. Raw provider responses are stored only when `LLM_STORE_RAW_RESPONSE=true`; enabling it is useful for local debugging but increases the amount of sensitive text stored in the database.
