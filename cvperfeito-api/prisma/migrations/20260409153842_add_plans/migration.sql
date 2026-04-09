-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'BASIC', 'PREMIUM');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "planGranted" "Plan" NOT NULL DEFAULT 'BASIC';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE';
