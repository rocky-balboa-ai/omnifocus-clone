-- AlterTable
ALTER TABLE "users" ADD COLUMN "botApiKey" TEXT;
ALTER TABLE "users" ADD COLUMN "botName" TEXT NOT NULL DEFAULT 'Rocky';

-- CreateIndex
CREATE UNIQUE INDEX "users_botApiKey_key" ON "users"("botApiKey");
