-- AlterTable: Add pipelineStageId to marketing_leads
ALTER TABLE "marketing_leads" ADD COLUMN "pipelineStageId" TEXT;

-- AddForeignKey
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_pipelineStageId_fkey" FOREIGN KEY ("pipelineStageId") REFERENCES "pipeline_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: CCS Frameworks
CREATE TABLE "ccs_frameworks" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "websiteUrl" TEXT,
    "maxValue" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ccs_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CCS Lots
CREATE TABLE "ccs_lots" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ccs_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CCS Opportunities
CREATE TABLE "ccs_opportunities" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "buyerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "publishedDate" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "value" DECIMAL(14,2),
    "region" TEXT,
    "category" TEXT,
    "noticeUrl" TEXT,
    "notes" TEXT,
    "bidStatus" TEXT NOT NULL DEFAULT 'NOT_BIDDING',
    "bidDeadline" TIMESTAMP(3),
    "bidValue" DECIMAL(14,2),
    "assignedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ccs_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: CCS framework reference uniqueness
CREATE UNIQUE INDEX "ccs_frameworks_reference_key" ON "ccs_frameworks"("reference");

-- AddForeignKey: CCS Lots → Frameworks
ALTER TABLE "ccs_lots" ADD CONSTRAINT "ccs_lots_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ccs_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CCS Opportunities → Frameworks
ALTER TABLE "ccs_opportunities" ADD CONSTRAINT "ccs_opportunities_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ccs_frameworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: CCS Opportunities → Users
ALTER TABLE "ccs_opportunities" ADD CONSTRAINT "ccs_opportunities_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
