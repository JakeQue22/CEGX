-- CreateTable
CREATE TABLE "email_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "columns" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_list_entries" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_list_entries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "email_list_entries" ADD CONSTRAINT "email_list_entries_listId_fkey" FOREIGN KEY ("listId") REFERENCES "email_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
