// Migration: Add Feedback table + User.isGlobalAdmin
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:./prisma/dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

const migrations = [
  // Add isGlobalAdmin to User
  `ALTER TABLE "User" ADD COLUMN "isGlobalAdmin" BOOLEAN NOT NULL DEFAULT 0`,

  // Create Feedback table
  `CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'nouveau',
    "priority" TEXT NOT NULL DEFAULT 'normale',
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Feedback_userId_idx" ON "Feedback" ("userId")`,
  `CREATE INDEX IF NOT EXISTS "Feedback_status_idx" ON "Feedback" ("status")`,
];

async function main() {
  for (const sql of migrations) {
    try {
      console.log(`Running: ${sql.substring(0, 80)}...`);
      await db.execute(sql);
      console.log("  ✓ Success");
    } catch (err) {
      if (
        err.message?.includes("already exists") ||
        err.message?.includes("duplicate column")
      ) {
        console.log("  ⏭ Already exists, skipping");
      } else {
        console.error("  ✗ Error:", err.message);
      }
    }
  }
  console.log("\nFeedback migration complete!");
}

main().catch(console.error);
