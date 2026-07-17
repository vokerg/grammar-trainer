-- CreateTable
CREATE TABLE "Submission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "text" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "Analysis" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "submissionId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "detectedLanguage" TEXT,
  "overallFeedback" TEXT,
  "correctedText" TEXT,
  "styleFeedback" JSONB,
  "provider" TEXT,
  "model" TEXT,
  "rawResponse" TEXT,
  "errorMessage" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Analysis_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "TrainingItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "language" TEXT NOT NULL,
  "category" TEXT NOT NULL,
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
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "Mistake" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "analysisId" TEXT NOT NULL,
  "trainingItemId" TEXT,
  "original" TEXT NOT NULL,
  "correct" TEXT NOT NULL,
  "normalizedOriginal" TEXT NOT NULL,
  "normalizedCorrect" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "originalSentence" TEXT,
  "distractorOne" TEXT,
  "distractorTwo" TEXT,
  "trainable" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Mistake_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Mistake_trainingItemId_fkey" FOREIGN KEY ("trainingItemId") REFERENCES "TrainingItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "TrainingAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "trainingItemId" TEXT NOT NULL,
  "selectedOption" TEXT NOT NULL,
  "wasCorrect" BOOLEAN NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrainingAttempt_trainingItemId_fkey" FOREIGN KEY ("trainingItemId") REFERENCES "TrainingItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Analysis_submissionId_createdAt_idx" ON "Analysis"("submissionId", "createdAt");
CREATE INDEX "Mistake_analysisId_idx" ON "Mistake"("analysisId");
CREATE INDEX "Mistake_trainingItemId_idx" ON "Mistake"("trainingItemId");
CREATE UNIQUE INDEX "TrainingItem_language_normalizedOriginal_normalizedCorrect_key" ON "TrainingItem"("language", "normalizedOriginal", "normalizedCorrect");
CREATE INDEX "TrainingItem_language_active_idx" ON "TrainingItem"("language", "active");
CREATE INDEX "TrainingItem_nextPracticeAt_idx" ON "TrainingItem"("nextPracticeAt");
CREATE INDEX "TrainingItem_normalizedCorrect_idx" ON "TrainingItem"("normalizedCorrect");
CREATE INDEX "TrainingAttempt_trainingItemId_createdAt_idx" ON "TrainingAttempt"("trainingItemId", "createdAt");
