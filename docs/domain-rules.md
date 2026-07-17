# Domain Rules

## Records

- **Submission:** learner text; exists even if analysis fails.
- **Analysis:** one LLM attempt with pending/completed/failed status.
- **Mistake:** one correction in one analysis.
- **Training item:** reusable contextual exercise created only from a valid trainable mistake.
- **Training attempt:** one submitted answer.

Do not collapse these concepts into one table or lifecycle.

## Trainability

Usually trainable when four short contextual sentence options are possible:

- spelling;
- grammar;
- joined/separated words;
- short fixed expressions;
- directly comparable word-choice errors;
- punctuation with an unambiguous sentence-level choice.

Not trainable in the current exercise type:

- capitalization;
- sentence or paragraph restructuring;
- large rewrites;
- optional style improvements;
- ambiguous corrections;
- cases without two plausible contextual distractors.

A semantically invalid item is downgraded to non-trainable; it must not fail the whole analysis. Persist a `trainingReason` so the result UI can explain the decision.

## Four-option contextual exercises

Options are complete short sentences or meaningful word sequences:

1. the learner's original sentence;
2. the corrected sentence;
3. a plausible incorrect contextual variant;
4. another plausible incorrect contextual variant.

All four must keep the same meaning and surrounding context, be non-empty, and be unique after normalization. Only the target correction should change. Shuffle complete options only.

Never return the correct option or answer metadata before an attempt. Validate answers server-side against the canonical stored four-option set.

Legacy isolated-word distractors may be upgraded to context only when the original sentence contains the exact target and all four sentences can be reconstructed safely.

## Normalization and deduplication

Use the shared normalization helper:

- NFC Unicode normalization;
- trim edges;
- collapse internal whitespace;
- locale-aware lowercase;
- preserve language-specific characters.

Keep original display values. Deduplicate training items by:

```text
language + normalized original correction fragment + normalized correct correction fragment
```

A duplicate item may refresh its contextual sentences without resetting statistics.

## Languages and UI

Supported languages are Danish (`da`), English (`en`), German (`de`), and Russian (`ru`). UI labels live in `apps/web/src/i18n.tsx`. Selecting a language changes both the writing language and interface language and is persisted locally.

## LLM handling

- Validate structure with the shared Zod schema.
- Apply semantic validation after structural validation.
- Strip code fences and parse JSON safely.
- Use at most the configured repair/retry behavior.
- Save safe errors; do not expose raw stack traces or provider credentials.
- Raw responses are stored only when explicitly enabled.

## Feedback and privacy

Feedback must start supportively, stay concrete and age-appropriate, and use the requested language. Distinguish required corrections from optional style advice.

Send only text, requested language, and analysis instructions to the LLM. Do not log full learner text, secrets, authorization headers, or raw responses by default.
