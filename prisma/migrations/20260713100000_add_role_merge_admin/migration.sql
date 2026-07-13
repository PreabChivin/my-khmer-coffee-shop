-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CUSTOMER';

-- Migrate the existing Admin row(s) into User, preserving id/username/password
-- hash (both sides already use bcryptjs, so the hash is portable as-is).
-- Admin has no email column, so one is synthesized to satisfy User.email's
-- unique+required constraint while keeping the same username for login.
-- The Admin table itself is intentionally NOT dropped here — see the model
-- comment in schema.prisma. It becomes an inert legacy table until a later
-- cleanup migration.
INSERT INTO "User" (id, email, username, "passwordHash", name, role, "loyaltyPoints", badges, "createdAt", "updatedAt")
SELECT a.id,
       COALESCE(a.username, 'staff-' || a.id) || '@benchimin.cafe',
       a.username,
       a.password,
       a.name,
       'ADMIN',
       0,
       '{}',
       a."createdAt",
       a."updatedAt"
FROM "Admin" a
ON CONFLICT (id) DO NOTHING;
