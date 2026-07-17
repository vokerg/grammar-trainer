ALTER TABLE "Mistake" ADD COLUMN "trainingOriginal" TEXT;
ALTER TABLE "Mistake" ADD COLUMN "trainingCorrect" TEXT;
ALTER TABLE "Mistake" ADD COLUMN "trainingReason" TEXT;
ALTER TABLE "TrainingItem" ADD COLUMN "exerciseType" TEXT NOT NULL DEFAULT 'FORM';
