-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Your Business Name',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "updatedAt" DATETIME NOT NULL
);
