-- AlterTable: Make companyName optional and add product/category to marketing_leads
ALTER TABLE "marketing_leads" ALTER COLUMN "companyName" DROP NOT NULL;
ALTER TABLE "marketing_leads" ADD COLUMN "productId" TEXT;
ALTER TABLE "marketing_leads" ADD COLUMN "categoryId" TEXT;

-- AddForeignKey
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
