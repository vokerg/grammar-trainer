-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrainingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "language" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "exerciseType" TEXT NOT NULL DEFAULT 'FORM',
    "originalForm" TEXT NOT NULL,
    "correctForm" TEXT NOT NULL,
    "normalizedOriginal" TEXT NOT NULL,
    "normalizedCorrect" TEXT NOT NULL,
    "distractorOne" TEXT NOT NULL,
    "distractorTwo" TEXT NOT NULL,
    "timesSeen" INTEGER NOT NULL DEFAULT 0,
    "timesCorrect" INTEGER NOT NULL DEFAULT 0,
    "timesIncorrect" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" DATETIME,
    "nextPracticeAt" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "vocabularyEntryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingItem_vocabularyEntryId_fkey" FOREIGN KEY ("vocabularyEntryId") REFERENCES "VocabularyEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TrainingItem" ("active", "category", "correctForm", "createdAt", "distractorOne", "distractorTwo", "exerciseType", "id", "language", "lastPracticedAt", "nextPracticeAt", "normalizedCorrect", "normalizedOriginal", "originalForm", "timesCorrect", "timesIncorrect", "timesSeen", "updatedAt", "vocabularyEntryId") SELECT "active", "category", "correctForm", "createdAt", "distractorOne", "distractorTwo", "exerciseType", "id", "language", "lastPracticedAt", "nextPracticeAt", "normalizedCorrect", "normalizedOriginal", "originalForm", "timesCorrect", "timesIncorrect", "timesSeen", "updatedAt", "vocabularyEntryId" FROM "TrainingItem";
DROP TABLE "TrainingItem";
ALTER TABLE "new_TrainingItem" RENAME TO "TrainingItem";
CREATE INDEX "TrainingItem_language_active_idx" ON "TrainingItem"("language", "active");
CREATE INDEX "TrainingItem_nextPracticeAt_idx" ON "TrainingItem"("nextPracticeAt");
CREATE INDEX "TrainingItem_normalizedCorrect_idx" ON "TrainingItem"("normalizedCorrect");
CREATE INDEX "TrainingItem_vocabularyEntryId_idx" ON "TrainingItem"("vocabularyEntryId");
CREATE UNIQUE INDEX "TrainingItem_language_normalizedOriginal_normalizedCorrect_key" ON "TrainingItem"("language", "normalizedOriginal", "normalizedCorrect");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
