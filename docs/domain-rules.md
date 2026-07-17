# Domain Rules

## Records

- **Submission:** learner text; exists even if analysis fails.
- **Analysis:** one LLM attempt with pending/completed/failed status.
- **Mistake:** one correction in one analysis.
- **Training item:** reusable exercise created only from a valid trainable mistake.
- **Training attempt:** one submitted answer.

Do not collapse these concepts into one table or lifecycle.

## Trainability

Usually trainable:

- spelling;
- capitalization;
- joined/separated words;
- short fixed expressions;
- directly comparable short word-choice errors.

Usually not trainable:

- punctuation-only changes;
- sentence or paragraph restructuring;
- large rewrites;
- optional style improvements;
- ambiguous corrections;
- cases without two plausible distractors.

A semantically invalid trainable item is downgraded to non-trainable; it must not fail the whole analysis.

## Four-option exercises

Options are:

1. correct form;
2. learner's original form;
3. distractor one;
4. distractor two.

All four must be non-empty and unique after normalization. Distractors must be plausible incorrect forms of the same intended word/expression, in the same language, and different from the original and correct forms. Preserve spaces in expressions. Shuffle complete options only.

Never return the correct form, normalized correct form, or answer metadata from the session endpoint. Validate answers server-side against the canonical stored four-option set.

## Normalization and deduplication

Use the shared normalization helper:

- NFC Unicode normalization;
- trim edges;
- collapse internal whitespace;
- locale-aware lowercase;
- preserve characters such as `æ`, `ø`, and `å`.

Keep original display values. Deduplicate training items by:

```text
language + normalized original + normalized correct
```

Different wrong forms for the same correct form may remain separate items.

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
