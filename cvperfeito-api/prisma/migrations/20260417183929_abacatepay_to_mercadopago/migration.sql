/*
  Warnings:

  - You are about to drop the column `abacateId` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mercadoPagoId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Payment_abacateId_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "abacateId",
ADD COLUMN     "mercadoPagoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mercadoPagoId_key" ON "Payment"("mercadoPagoId");
