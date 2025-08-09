-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "caseDescription" TEXT,
    "claimSetupData" TEXT,
    "analysisQuestions" TEXT,
    "userAnswers" TEXT,
    "potentialClaimEvents" TEXT,
    "selectedClaims" TEXT,
    "finalDocument" TEXT,
    "vaFormData" TEXT,
    "statusHistory" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Claim" ("analysisQuestions", "caseDescription", "claimSetupData", "createdAt", "finalDocument", "id", "potentialClaimEvents", "selectedClaims", "status", "updatedAt", "userAnswers", "userId", "vaFormData") SELECT "analysisQuestions", "caseDescription", "claimSetupData", "createdAt", "finalDocument", "id", "potentialClaimEvents", "selectedClaims", "status", "updatedAt", "userAnswers", "userId", "vaFormData" FROM "Claim";
DROP TABLE "Claim";
ALTER TABLE "new_Claim" RENAME TO "Claim";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
