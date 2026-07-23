-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "watchlistSymbols" TEXT[] DEFAULT ARRAY[]::TEXT[];
