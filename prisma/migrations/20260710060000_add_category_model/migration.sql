-- Data-safe migration: Product.category (free-text string) -> Category
-- table + Product.categoryId (FK, cascade delete). Every step is ordered so
-- existing production rows never hit a NOT NULL violation and no data is
-- lost: the old "category" column is only dropped after every row has been
-- successfully backfilled with a matching categoryId.

-- 1. Create the Category table.
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconKey" TEXT,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- 2. Seed one Category row for every distinct value already present in
--    Product.category, so existing products can be backfilled without
--    inventing new category groupings. No-op on a fresh/empty database.
INSERT INTO "Category" ("id", "name", "iconKey", "createdAt", "updatedAt")
SELECT gen_random_uuid(), t."cat", t."cat", now(), now()
FROM (SELECT DISTINCT "category" AS "cat" FROM "Product") t
ON CONFLICT ("name") DO NOTHING;

-- 3. CRITICAL FOR DEPLOYMENT: guarantee a placeholder category always
--    exists, even on a fresh database with zero products yet. This is the
--    default categoryId fallback for step 5's safety net below.
INSERT INTO "Category" ("id", "name", "iconKey", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Uncategorized', 'other', now(), now())
ON CONFLICT ("name") DO NOTHING;

-- 4. Add categoryId as NULLABLE first — adding it NOT NULL directly would
--    fail immediately against any existing row.
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

-- 5. Backfill every existing product from its old category string.
UPDATE "Product" p
SET "categoryId" = c."id"
FROM "Category" c
WHERE p."category" = c."name";

-- 6. Safety net: anything that still didn't match (should not happen, but
--    this is exactly the "does not break due to null constraints"
--    requirement) falls back to the Uncategorized placeholder.
UPDATE "Product" p
SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Uncategorized')
WHERE p."categoryId" IS NULL;

-- 7. Every row is now backfilled — safe to enforce NOT NULL.
ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL;

-- 8. Drop the old free-text column now that categoryId fully replaces it.
ALTER TABLE "Product" DROP COLUMN "category";

-- 9. Foreign key + index.
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
