-- CreateTable
CREATE TABLE "ExpenseArchive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "totalAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompanyExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "notes" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "archiveId" TEXT,
    CONSTRAINT "CompanyExpense_archiveId_fkey" FOREIGN KEY ("archiveId") REFERENCES "ExpenseArchive" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CompanyExpense" ("amount", "category", "createdAt", "date", "id", "notes", "updatedAt") SELECT "amount", "category", "createdAt", "date", "id", "notes", "updatedAt" FROM "CompanyExpense";
DROP TABLE "CompanyExpense";
ALTER TABLE "new_CompanyExpense" RENAME TO "CompanyExpense";
CREATE INDEX "CompanyExpense_date_idx" ON "CompanyExpense"("date");
CREATE INDEX "CompanyExpense_archiveId_idx" ON "CompanyExpense"("archiveId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ExpenseArchive_periodStart_idx" ON "ExpenseArchive"("periodStart");
