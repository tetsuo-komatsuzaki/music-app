-- Safely migrate User.role from TEXT to Role enum, adding 'admin' value.
-- Uses swap-enum pattern to preserve existing row values and keep DDL atomic.

-- 1. Create new enum with the full set of values (including admin)
CREATE TYPE "Role_new" AS ENUM ('student', 'teacher', 'admin');

-- 2. Change the column type, casting existing TEXT values to the new enum.
--    Any existing value not in ('student','teacher','admin') would fail here;
--    verified beforehand that only these three values exist in User.role.
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role_new" USING ("role"::"Role_new");

-- 3. Set default so future inserts without an explicit role become 'student'.
ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT 'student'::"Role_new";

-- 4. Drop the old enum (no longer referenced by any column)
DROP TYPE "Role";

-- 5. Rename the new enum back to the canonical name "Role"
ALTER TYPE "Role_new" RENAME TO "Role";
