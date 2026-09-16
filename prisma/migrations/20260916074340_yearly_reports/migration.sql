-- CreateTable
CREATE TABLE "YearlyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
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
CREATE UNIQUE INDEX "YearlyReport_year_key" ON "YearlyReport"("year");

-- CreateIndex
CREATE INDEX "YearlyReport_year_idx" ON "YearlyReport"("year");
