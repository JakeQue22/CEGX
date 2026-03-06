-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN "bankAccountName" TEXT,
ADD COLUMN "bankSortCode" TEXT,
ADD COLUMN "bankAccountNumber" TEXT,
ADD COLUMN "bankIban" TEXT,
ADD COLUMN "stripeTestPublicKey" TEXT,
ADD COLUMN "stripeTestSecretKey" TEXT,
ADD COLUMN "stripeLivePublicKey" TEXT,
ADD COLUMN "stripeLiveSecretKey" TEXT,
ADD COLUMN "stripeMode" TEXT NOT NULL DEFAULT 'test';
