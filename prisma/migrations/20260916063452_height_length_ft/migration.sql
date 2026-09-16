/*
  Warnings:

  - You are about to drop the column `heightMm` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `lengthMm` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `heightMm` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `lengthMm` on the `Sale` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "weightKg" REAL NOT NULL,
    "ratePerKg" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "landedCostPerKg" REAL NOT NULL DEFAULT 0,
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
    CONSTRAINT "Purchase_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Purchase_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- heightFt/lengthFt replace heightMm/lengthMm as a unit change (mm -> ft),
-- not just a rename — convert existing values (1 ft = 304.8 mm) so recorded
-- dimensions keep their real-world size instead of the raw number being
-- reinterpreted in a different unit.
INSERT INTO "new_Purchase" ("biltyNumber", "contactId", "createdAt", "date", "heightFt", "id", "landedCostPerKg", "lengthFt", "lotId", "materialId", "notes", "ratePerKg", "receiptNumber", "thicknessMm", "totalAmount", "updatedAt", "vehicleNumber", "weighbridgeWeightKg", "weightKg") SELECT "biltyNumber", "contactId", "createdAt", "date", "heightMm" / 304.8, "id", "landedCostPerKg", "lengthMm" / 304.8, "lotId", "materialId", "notes", "ratePerKg", "receiptNumber", "thicknessMm", "totalAmount", "updatedAt", "vehicleNumber", "weighbridgeWeightKg", "weightKg" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE UNIQUE INDEX "Purchase_lotId_key" ON "Purchase"("lotId");
CREATE INDEX "Purchase_contactId_idx" ON "Purchase"("contactId");
CREATE INDEX "Purchase_materialId_idx" ON "Purchase"("materialId");
CREATE INDEX "Purchase_date_idx" ON "Purchase"("date");
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleRef" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
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
    CONSTRAINT "Sale_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Same mm -> ft conversion as Purchase above.
INSERT INTO "new_Sale" ("biltyNumber", "contactId", "costPerKgAtSale", "createdAt", "date", "grandTotal", "heightFt", "id", "lengthFt", "materialId", "notes", "profitAmount", "ratePerKg", "receiptNumber", "saleRef", "thicknessMm", "totalAmount", "updatedAt", "vatAmount", "vatPercent", "vehicleNumber", "weighbridgeWeightKg", "weightKg") SELECT "biltyNumber", "contactId", "costPerKgAtSale", "createdAt", "date", "grandTotal", "heightMm" / 304.8, "id", "lengthMm" / 304.8, "materialId", "notes", "profitAmount", "ratePerKg", "receiptNumber", "saleRef", "thicknessMm", "totalAmount", "updatedAt", "vatAmount", "vatPercent", "vehicleNumber", "weighbridgeWeightKg", "weightKg" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_saleRef_key" ON "Sale"("saleRef");
CREATE INDEX "Sale_contactId_idx" ON "Sale"("contactId");
CREATE INDEX "Sale_materialId_idx" ON "Sale"("materialId");
CREATE INDEX "Sale_date_idx" ON "Sale"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
