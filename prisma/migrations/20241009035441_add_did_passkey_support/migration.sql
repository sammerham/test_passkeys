/*
  Warnings:

  - A unique constraint covering the columns `[credentialID]` on the table `PassKey` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PassKey" ALTER COLUMN "transports" SET NOT NULL,
ALTER COLUMN "transports" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "DIDKey" (
    "id" TEXT NOT NULL,
    "didKey" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DIDKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DIDKey_didKey_key" ON "DIDKey"("didKey");

-- CreateIndex
CREATE UNIQUE INDEX "PassKey_credentialID_key" ON "PassKey"("credentialID");

-- AddForeignKey
ALTER TABLE "DIDKey" ADD CONSTRAINT "DIDKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
