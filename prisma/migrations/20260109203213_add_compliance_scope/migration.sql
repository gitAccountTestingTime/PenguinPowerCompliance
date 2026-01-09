/*
  Warnings:

  - You are about to drop the column `state` on the `ComplianceAccountType` table. All the data in the column will be lost.
  - You are about to drop the column `stateAgency` on the `ComplianceAccountType` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `StateResource` table. All the data in the column will be lost.
  - Added the required column `agency` to the `ComplianceAccountType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scopeId` to the `ComplianceAccountType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scopeId` to the `StateResource` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ComplianceScope" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ComplianceAccountType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "description" TEXT,
    "requiredFields" TEXT,
    "defaultDuration" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ComplianceAccountType_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "ComplianceScope" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ComplianceAccountType" ("createdAt", "defaultDuration", "description", "id", "isActive", "name", "requiredFields", "updatedAt") SELECT "createdAt", "defaultDuration", "description", "id", "isActive", "name", "requiredFields", "updatedAt" FROM "ComplianceAccountType";
DROP TABLE "ComplianceAccountType";
ALTER TABLE "new_ComplianceAccountType" RENAME TO "ComplianceAccountType";
CREATE UNIQUE INDEX "ComplianceAccountType_name_scopeId_agency_key" ON "ComplianceAccountType"("name", "scopeId", "agency");
CREATE TABLE "new_StateResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scopeId" TEXT NOT NULL,
    "complianceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredDocuments" TEXT,
    "filingFrequency" TEXT,
    "fees" TEXT,
    "portalLink" TEXT,
    "additionalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StateResource_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "ComplianceScope" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StateResource" ("additionalNotes", "complianceType", "createdAt", "description", "fees", "filingFrequency", "id", "portalLink", "requiredDocuments", "title", "updatedAt") SELECT "additionalNotes", "complianceType", "createdAt", "description", "fees", "filingFrequency", "id", "portalLink", "requiredDocuments", "title", "updatedAt" FROM "StateResource";
DROP TABLE "StateResource";
ALTER TABLE "new_StateResource" RENAME TO "StateResource";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceScope_code_key" ON "ComplianceScope"("code");
