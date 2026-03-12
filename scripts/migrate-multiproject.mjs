import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://chantierhub-nicolas456123.aws-eu-west-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Migration: User name → firstName + lastName, add projectId to all models, create UserProject
const migrations = [
  // 1. User: add firstName, lastName columns
  `ALTER TABLE User ADD COLUMN firstName TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE User ADD COLUMN lastName TEXT NOT NULL DEFAULT ''`,
  // Copy existing name to firstName (best effort)
  `UPDATE User SET firstName = name WHERE firstName = ''`,
  // Remove role column is not needed, keep it for now

  // 2. Create UserProject join table
  `CREATE TABLE IF NOT EXISTS UserProject (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    projectId TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS UserProject_userId_projectId_key ON UserProject(userId, projectId)`,
  `CREATE INDEX IF NOT EXISTS UserProject_userId_idx ON UserProject(userId)`,
  `CREATE INDEX IF NOT EXISTS UserProject_projectId_idx ON UserProject(projectId)`,

  // 3. Add projectId to Event
  `ALTER TABLE Event ADD COLUMN projectId TEXT NOT NULL DEFAULT 'default'`,
  `CREATE INDEX IF NOT EXISTS Event_projectId_idx ON Event(projectId)`,

  // 4. Add projectId to Request
  `ALTER TABLE Request ADD COLUMN projectId TEXT NOT NULL DEFAULT 'default'`,
  `CREATE INDEX IF NOT EXISTS Request_projectId_idx ON Request(projectId)`,

  // 5. Add projectId to Document
  `ALTER TABLE Document ADD COLUMN projectId TEXT NOT NULL DEFAULT 'default'`,
  `CREATE INDEX IF NOT EXISTS Document_projectId_idx ON Document(projectId)`,

  // 6. Add projectId to Task
  `ALTER TABLE Task ADD COLUMN projectId TEXT NOT NULL DEFAULT 'default'`,
  `CREATE INDEX IF NOT EXISTS Task_projectId_idx ON Task(projectId)`,

  // 7. Add projectId to Activity
  `ALTER TABLE Activity ADD COLUMN projectId TEXT NOT NULL DEFAULT 'default'`,
  `CREATE INDEX IF NOT EXISTS Activity_projectId_idx ON Activity(projectId)`,
];

async function main() {
  for (const sql of migrations) {
    try {
      await client.execute(sql);
      console.log("OK:", sql.substring(0, 70) + "...");
    } catch (e) {
      // Ignore "column already exists" or "index already exists" errors
      const msg = e.message || "";
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        console.log("SKIP (already done):", sql.substring(0, 70) + "...");
      } else {
        console.error("ERROR:", msg);
        console.error("SQL:", sql);
      }
    }
  }

  console.log("\nMigration completed!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
