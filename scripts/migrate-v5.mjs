import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log("=== Migration V5 : MeetingTemplate ===\n");

  // ─── MeetingTemplate table ───
  console.log("A. Table MeetingTemplate...");
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS "MeetingTemplate" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT DEFAULT '{}',
      isDefault BOOLEAN DEFAULT 0,
      projectId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES "Project"(id) ON DELETE CASCADE
    )`);
    console.log("  OK: MeetingTemplate");
  } catch (e) {
    console.log(`  INFO: ${e.message}`);
  }
  try {
    await db.execute(`CREATE INDEX IF NOT EXISTS "MeetingTemplate_projectId_idx" ON "MeetingTemplate" (projectId)`);
    console.log("  OK: indexes");
  } catch (e) {
    console.log(`  INFO: ${e.message}`);
  }

  console.log("\n=== Migration V5 terminée! ===");
}

migrate().catch(console.error);
