-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMINISTRATOR', 'PROFESSIONAL', 'STANDARD', 'RESEARCH');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STANDARD',
    "displayName" TEXT,
    "timezone" TEXT,
    "notificationPreferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_authUserId_key" ON "user_profiles"("authUserId");
