-- CreateTable
CREATE TABLE "ComplianceAccountType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "stateAgency" TEXT NOT NULL,
    "description" TEXT,
    "requiredFields" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ComplianceSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complianceType" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "stateAgency" TEXT NOT NULL,
    "complianceAccountTypeId" TEXT,
    "entityName" TEXT,
    "registrationNumber" TEXT,
    "filingDate" DATETIME,
    "expirationDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "filingStorageLink" TEXT,
    "compliancePageLink" TEXT,
    "passwordManagerLink" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ComplianceSubmission_complianceAccountTypeId_fkey" FOREIGN KEY ("complianceAccountTypeId") REFERENCES "ComplianceAccountType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ComplianceSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ComplianceSubmission" ("compliancePageLink", "complianceType", "createdAt", "entityName", "expirationDate", "filingDate", "filingStorageLink", "id", "notes", "passwordManagerLink", "registrationNumber", "state", "stateAgency", "status", "updatedAt", "userId") SELECT "compliancePageLink", "complianceType", "createdAt", "entityName", "expirationDate", "filingDate", "filingStorageLink", "id", "notes", "passwordManagerLink", "registrationNumber", "state", "stateAgency", "status", "updatedAt", "userId" FROM "ComplianceSubmission";
DROP TABLE "ComplianceSubmission";
ALTER TABLE "new_ComplianceSubmission" RENAME TO "ComplianceSubmission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceAccountType_name_state_key" ON "ComplianceAccountType"("name", "state");
