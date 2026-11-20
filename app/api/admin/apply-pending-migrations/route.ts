import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { verifySession } from "@/app/lib/dal";

// `prisma migrate deploy` can't connect to a Turso `libsql://` URL directly
// (it only understands the native SQLite/Postgres/etc. connection schemes,
// not the driver-adapter protocol the app itself uses at runtime — see
// https://pris.ly/d/connection-url, error P1013). This replicates just
// enough of what `migrate deploy` does — run each pending migration's SQL
// and record it in `_prisma_migrations` — using the same libsql client the
// app already connects to production with successfully. Safe to hit
// repeatedly: anything already recorded is skipped.
export async function GET() {
  await verifySession();

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "checksum" TEXT NOT NULL,
        "finished_at" DATETIME,
        "migration_name" TEXT NOT NULL,
        "logs" TEXT,
        "rolled_back_at" DATETIME,
        "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
        "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
      )
    `);

    const appliedRows = await client.execute(`SELECT migration_name FROM "_prisma_migrations"`);
    const applied = new Set(appliedRows.rows.map((r) => String(r.migration_name)));

    const migrationNames = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    const results: { name: string; status: "already applied" | "applied" }[] = [];

    for (const name of migrationNames) {
      if (applied.has(name)) {
        results.push({ name, status: "already applied" });
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, name, "migration.sql"), "utf8");
      const checksum = crypto.createHash("sha256").update(sql).digest("hex");

      await client.executeMultiple(sql);

      const now = new Date().toISOString();
      await client.execute({
        sql: `INSERT INTO "_prisma_migrations"
              (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
              VALUES (?, ?, ?, ?, ?, 1)`,
        args: [crypto.randomUUID(), checksum, now, name, now],
      });

      results.push({ name, status: "applied" });
    }

    return NextResponse.json({ results });
  } finally {
    client.close();
  }
}
