-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wallet" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maskedId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CITIZEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ParcelMeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ulpin" TEXT,
    "surveyNumber" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "addressText" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "area" INTEGER NOT NULL,
    "ownerWallet" TEXT NOT NULL,
    "currentDocId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parcelId" INTEGER NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "aiReport" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "ParcelMeta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransferMeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parcelId" INTEGER NOT NULL,
    "seller" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "newDocumentHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FraudAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parcelId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FraudAlert_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "ParcelMeta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ChainEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parcelId" INTEGER,
    "transferId" INTEGER,
    "type" TEXT NOT NULL,
    "fromAddr" TEXT,
    "toAddr" TEXT,
    "txHash" TEXT NOT NULL,
    "blockNum" INTEGER NOT NULL,
    "at" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SimParcel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "surveyNumber" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "geo" TEXT NOT NULL,
    "area" INTEGER NOT NULL,
    "documentHash" TEXT NOT NULL,
    "registeredAt" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "ownerWallet" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SimTransfer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parcelId" INTEGER NOT NULL,
    "seller" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "newDocumentHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_key" ON "User"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "ParcelMeta_ulpin_key" ON "ParcelMeta"("ulpin");
