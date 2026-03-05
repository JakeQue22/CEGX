-- AlterTable: Add structured delivery address fields to customer_orders
ALTER TABLE "customer_orders" ADD COLUMN "deliveryStreet" TEXT;
ALTER TABLE "customer_orders" ADD COLUMN "deliveryStreet2" TEXT;
ALTER TABLE "customer_orders" ADD COLUMN "deliveryCity" TEXT;
ALTER TABLE "customer_orders" ADD COLUMN "deliveryCounty" TEXT;
ALTER TABLE "customer_orders" ADD COLUMN "deliveryPostcode" TEXT;
