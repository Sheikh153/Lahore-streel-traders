-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleRef" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "purchaseId" TEXT,
    "weightKg" REAL NOT NULL,
    "ratePerKg" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "vatPercent" REAL NOT NULL DEFAULT 0,
    "vatAmount" REAL NOT NULL DEFAULT 0,
    "grandTotal" REAL NOT NULL DEFAULT 0,
    "costPerKgAtSale" REAL NOT NULL,
    "profitAmount" REAL NOT NULL,
    "weighbridgeWeightKg" REAL,
    "vehicleNumber" TEXT,
    "biltyNumber" TEXT,
    "receiptNumber" TEXT,
    "thicknessMm" REAL,
    "heightFt" REAL,
    "lengthFt" REAL,
    "notes" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("biltyNumber", "contactId", "costPerKgAtSale", "createdAt", "date", "grandTotal", "heightFt", "id", "lengthFt", "materialId", "notes", "profitAmount", "ratePerKg", "receiptNumber", "saleRef", "thicknessMm", "totalAmount", "updatedAt", "vatAmount", "vatPercent", "vehicleNumber", "weighbridgeWeightKg", "weightKg") SELECT "biltyNumber", "contactId", "costPerKgAtSale", "createdAt", "date", "grandTotal", "heightFt", "id", "lengthFt", "materialId", "notes", "profitAmount", "ratePerKg", "receiptNumber", "saleRef", "thicknessMm", "totalAmount", "updatedAt", "vatAmount", "vatPercent", "vehicleNumber", "weighbridgeWeightKg", "weightKg" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_saleRef_key" ON "Sale"("saleRef");
CREATE INDEX "Sale_contactId_idx" ON "Sale"("contactId");
CREATE INDEX "Sale_materialId_idx" ON "Sale"("materialId");
CREATE INDEX "Sale_purchaseId_idx" ON "Sale"("purchaseId");
CREATE INDEX "Sale_date_idx" ON "Sale"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
