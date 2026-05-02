-- AlterTable
ALTER TABLE "public"."User"
ADD COLUMN "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
