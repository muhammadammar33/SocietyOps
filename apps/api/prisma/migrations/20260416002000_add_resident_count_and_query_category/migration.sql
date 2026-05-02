-- CreateEnum
CREATE TYPE "public"."ComplaintCategory" AS ENUM ('ISSUE', 'QUERY');

-- AlterTable
ALTER TABLE "public"."House"
ADD COLUMN "residentCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Complaint"
ADD COLUMN "category" "public"."ComplaintCategory" NOT NULL DEFAULT 'ISSUE';
