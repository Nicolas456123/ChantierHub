// Migration: Add Photo table
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const migrations = [
  `CREATE TABLE IF NOT EXISTS "Photo" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "caption" TEXT,
    "author" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "Photo_entityType_entityId_idx" ON "Photo" ("entityType", "entityId")`,
  `CREATE INDEX IF NOT EXISTS "Photo_projectId_idx" ON "Photo" ("projectId")`,
];

async function main() {
  for (const sql of migrations) {
    try {
      console.log(`Running: ${sql.substring(0, 80)}...`);
      await db.execute(sql);
      console.log("  ✓ Success");
    } catch (err) {
      if (err.message?.includes("already exists")) {
        console.log("  ⏭ Already exists, skipping");
      } else {
        console.error("  ✗ Error:", err.message);
      }
    }
  }
  console.log("\nPhoto migration complete!");
}

main().catch(console.error);
