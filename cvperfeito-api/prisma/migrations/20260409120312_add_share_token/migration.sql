/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `Resume` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Resume_shareToken_key" ON "Resume"("shareToken");
