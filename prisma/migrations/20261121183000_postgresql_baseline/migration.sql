-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MistakeCategory" AS ENUM ('SPELLING', 'GRAMMAR', 'WORD_CHOICE', 'EXPRESSION', 'CAPITALIZATION', 'PUNCTUATION', 'OTHER');

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "detectedLanguage" TEXT,
    "overallFeedback" TEXT,
    "correctedText" TEXT,
    "styleFeedback" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "rawResponse" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mistake" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "trainingItemId" TEXT,
    "original" TEXT NOT NULL,
    "correct" TEXT NOT NULL,
    "normalizedOriginal" TEXT NOT NULL,
    "normalizedCorrect" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "category" "MistakeCategory" NOT NULL,
    "originalSentence" TEXT,
    "trainingOriginal" TEXT,
    "trainingCorrect" TEXT,
    "distractorOne" TEXT,
    "distractorTwo" TEXT,
    "trainingReason" TEXT,
    "trainable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mistake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingItem" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "category" "MistakeCategory" NOT NULL,
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
    "lastPracticedAt" TIMESTAMP(3),
    "nextPracticeAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "vocabularyEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyEntry" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "category" "MistakeCategory" NOT NULL,
    "original" TEXT NOT NULL,
    "correct" TEXT NOT NULL,
    "normalizedOriginal" TEXT NOT NULL,
    "normalizedCorrect" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAttempt" (
    "id" TEXT NOT NULL,
    "trainingItemId" TEXT NOT NULL,
    "selectedOption" TEXT NOT NULL,
    "wasCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analysis_submissionId_createdAt_idx" ON "Analysis"("submissionId", "createdAt");

-- CreateIndex
CREATE INDEX "Mistake_analysisId_idx" ON "Mistake"("analysisId");

-- CreateIndex
CREATE INDEX "Mistake_trainingItemId_idx" ON "Mistake"("trainingItemId");

-- CreateIndex
CREATE INDEX "TrainingItem_language_active_idx" ON "TrainingItem"("language", "active");

-- CreateIndex
CREATE INDEX "TrainingItem_nextPracticeAt_idx" ON "TrainingItem"("nextPracticeAt");

-- CreateIndex
CREATE INDEX "TrainingItem_normalizedCorrect_idx" ON "TrainingItem"("normalizedCorrect");

-- CreateIndex
CREATE INDEX "TrainingItem_vocabularyEntryId_idx" ON "TrainingItem"("vocabularyEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingItem_language_normalizedOriginal_normalizedCorrect_key" ON "TrainingItem"("language", "normalizedOriginal", "normalizedCorrect");

-- CreateIndex
CREATE INDEX "VocabularyEntry_language_active_idx" ON "VocabularyEntry"("language", "active");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyEntry_language_normalizedOriginal_normalizedCorre_key" ON "VocabularyEntry"("language", "normalizedOriginal", "normalizedCorrect");

-- CreateIndex
CREATE INDEX "TrainingAttempt_trainingItemId_createdAt_idx" ON "TrainingAttempt"("trainingItemId", "createdAt");

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_trainingItemId_fkey" FOREIGN KEY ("trainingItemId") REFERENCES "TrainingItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingItem" ADD CONSTRAINT "TrainingItem_vocabularyEntryId_fkey" FOREIGN KEY ("vocabularyEntryId") REFERENCES "VocabularyEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttempt" ADD CONSTRAINT "TrainingAttempt_trainingItemId_fkey" FOREIGN KEY ("trainingItemId") REFERENCES "TrainingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

