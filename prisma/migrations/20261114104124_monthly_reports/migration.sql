-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodStart" DATETIME NOT NULL,
    "label" TEXT NOT NULL,
    "revenue" REAL NOT NULL,
    "netProfit" REAL NOT NULL,
    "weightBought" REAL NOT NULL,
    "weightSold" REAL NOT NULL,
    "stockOnHandKg" REAL NOT NULL,
    "stockValue" REAL NOT NULL,
    "receivables" REAL NOT NULL,
    "payables" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReport_periodStart_key" ON "MonthlyReport"("periodStart");

-- CreateIndex
CREATE INDEX "MonthlyReport_periodStart_idx" ON "MonthlyReport"("periodStart");
