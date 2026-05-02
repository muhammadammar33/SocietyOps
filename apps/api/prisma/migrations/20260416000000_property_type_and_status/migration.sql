-- CreateEnum
CREATE TYPE "public"."PropertyType" AS ENUM ('HOUSE', 'PLOT');

-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('OCCUPIED', 'VACANT', 'FOR_SALE', 'FOR_RENT');

-- AlterTable: add type column
ALTER TABLE "public"."House" ADD COLUMN "type" "public"."PropertyType" NOT NULL DEFAULT 'HOUSE';

-- AlterTable: make ownerId nullable
ALTER TABLE "public"."House" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AlterTable: migrate status from HouseStatus to PropertyStatus
ALTER TABLE "public"."House" ADD COLUMN "newStatus" "public"."PropertyStatus";

UPDATE "public"."House"
SET "newStatus" = CASE
  WHEN "status"::text = 'OCCUPIED' THEN 'OCCUPIED'::"public"."PropertyStatus"
  WHEN "status"::text = 'VACANT'   THEN 'VACANT'::"public"."PropertyStatus"
  ELSE 'VACANT'::"public"."PropertyStatus"
END;

ALTER TABLE "public"."House" DROP COLUMN "status";
ALTER TABLE "public"."House" RENAME COLUMN "newStatus" TO "status";
ALTER TABLE "public"."House" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "public"."House" ALTER COLUMN "status" SET DEFAULT 'OCCUPIED';

-- DropEnum
DROP TYPE "public"."HouseStatus";
