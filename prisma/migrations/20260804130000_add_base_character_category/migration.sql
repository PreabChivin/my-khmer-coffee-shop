-- AlterEnum
-- Split into its own migration: Postgres cannot use a freshly-added enum
-- value in the same transaction that added it, and `prisma migrate deploy`
-- runs each migration file as its own transaction. This value is used by
-- the next migration (20260804130100_add_model3d_and_characters).
ALTER TYPE "ShopItemCategory" ADD VALUE 'BASE_CHARACTER';
