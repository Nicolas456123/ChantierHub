import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://chantierhub-nicolas456123.aws-eu-west-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const migrations = [
  `CREATE TABLE IF NOT EXISTS Constraint (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    dueDate DATETIME,
    penaltyAmount REAL,
    penaltyUnit TEXT,
    penaltyDetails TEXT,
    responsible TEXT,
    author TEXT NOT NULL,
    projectId TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS Constraint_projectId_idx ON Constraint(projectId)`,
  `CREATE INDEX IF NOT EXISTS Constraint_status_idx ON Constraint(status)`,
  `CREATE INDEX IF NOT EXISTS Constraint_dueDate_idx ON Constraint(dueDate)`,
];

async function main() {
  for (const sql of migrations) {
    try {
      await client.execute(sql);
      console.log("OK:", sql.substring(0, 60) + "...");
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("already exists")) {
        console.log("SKIP (already done):", sql.substring(0, 60) + "...");
      } else {
        console.error("ERROR:", msg);
      }
    }
  }

  console.log("\nConstraint table created!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
