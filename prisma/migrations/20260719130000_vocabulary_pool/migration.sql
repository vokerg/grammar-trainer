CREATE TABLE "VocabularyEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "language" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "original" TEXT NOT NULL,
  "correct" TEXT NOT NULL,
  "normalizedOriginal" TEXT NOT NULL,
  "normalizedCorrect" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "VocabularyEntry_language_normalizedOriginal_normalizedCorrect_key"
ON "VocabularyEntry"("language", "normalizedOriginal", "normalizedCorrect");
CREATE INDEX "VocabularyEntry_language_active_idx" ON "VocabularyEntry"("language", "active");

INSERT INTO "VocabularyEntry" (
  "id", "language", "category", "original", "correct", "normalizedOriginal", "normalizedCorrect", "updatedAt"
)
SELECT
  lower(hex(randomblob(16))),
  "Submission"."language",
  "Mistake"."category",
  "Mistake"."original",
  "Mistake"."correct",
  "Mistake"."normalizedOriginal",
  "Mistake"."normalizedCorrect",
  CURRENT_TIMESTAMP
FROM "Mistake"
JOIN "Analysis" ON "Analysis"."id" = "Mistake"."analysisId"
JOIN "Submission" ON "Submission"."id" = "Analysis"."submissionId"
GROUP BY "Submission"."language", "Mistake"."normalizedOriginal", "Mistake"."normalizedCorrect";

ALTER TABLE "TrainingItem" ADD COLUMN "vocabularyEntryId" TEXT;
UPDATE "TrainingItem"
SET "vocabularyEntryId" = (
  SELECT "VocabularyEntry"."id"
  FROM "VocabularyEntry"
  WHERE "VocabularyEntry"."language" = "TrainingItem"."language"
    AND "VocabularyEntry"."normalizedOriginal" = "TrainingItem"."normalizedOriginal"
    AND "VocabularyEntry"."normalizedCorrect" = "TrainingItem"."normalizedCorrect"
);
CREATE INDEX "TrainingItem_vocabularyEntryId_idx" ON "TrainingItem"("vocabularyEntryId");
