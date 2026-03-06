-- AlterTable: Add howToBuy field to CCS frameworks
ALTER TABLE "ccs_frameworks" ADD COLUMN IF NOT EXISTS "howToBuy" TEXT;

-- AlterTable: Add multi-select fields to MarketingLead
ALTER TABLE "marketing_leads" ADD COLUMN IF NOT EXISTS "productIds" JSONB;
ALTER TABLE "marketing_leads" ADD COLUMN IF NOT EXISTS "categoryIds" JSONB;
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "customerId" TEXT;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_customerId_fkey') THEN
    ALTER TABLE "deals" ADD CONSTRAINT "deals_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable: CourierPricing
CREATE TABLE IF NOT EXISTS "courier_pricings" (
    "id" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER,
    "price" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courier_pricings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courier_pricings_courierId_fkey') THEN
    ALTER TABLE "courier_pricings" ADD CONSTRAINT "courier_pricings_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "couriers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
