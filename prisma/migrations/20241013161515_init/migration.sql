-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebauthnCredential" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebauthnCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DidKey" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "didKey" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,

    CONSTRAINT "DidKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebauthnCredential_credentialId_key" ON "WebauthnCredential"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "DidKey_didKey_key" ON "DidKey"("didKey");

-- AddForeignKey
ALTER TABLE "WebauthnCredential" ADD CONSTRAINT "WebauthnCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DidKey" ADD CONSTRAINT "DidKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
