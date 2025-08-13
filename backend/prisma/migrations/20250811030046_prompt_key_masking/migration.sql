-- AlterTable
ALTER TABLE "PromptConfig" ADD COLUMN "apiKeyLast4" TEXT;
ALTER TABLE "PromptConfig" ADD COLUMN "apiKeyUpdatedAt" DATETIME;
