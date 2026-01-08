-- AlterTable
ALTER TABLE "ComplianceAccountType" ADD COLUMN "defaultDuration" TEXT;

-- AlterTable
ALTER TABLE "ComplianceSubmission" ADD COLUMN "duration" TEXT;
