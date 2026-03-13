import { createClient } from "@libsql/client";
import bcryptjs from "bcryptjs";

const c = createClient({ url: "file:./dev.db" });

const stmts = [
  `CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    firstName TEXT NOT NULL DEFAULT '',
    lastName TEXT NOT NULL DEFAULT '',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS User_email_key ON User(email)`,
  `CREATE TABLE IF NOT EXISTS Session (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS Session_userId_idx ON Session(userId)`,
  `CREATE TABLE IF NOT EXISTS Project (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Mon Chantier',
    description TEXT,
    accessCode TEXT NOT NULL DEFAULT '1234',
    startDate DATETIME,
    endDate DATETIME,
    address TEXT,
    pdfSettings TEXT NOT NULL DEFAULT '{}',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
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
  `CREATE TABLE IF NOT EXISTS Event (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    author TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normale',
    projectId TEXT NOT NULL DEFAULT 'default',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS Request (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en_attente',
    author TEXT NOT NULL,
    assignedTo TEXT,
    dueDate DATETIME,
    projectId TEXT NOT NULL DEFAULT 'default',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS Comment (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    entityType TEXT,
    entityId TEXT,
    requestId TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS Comment_requestId_idx ON Comment(requestId)`,
  `CREATE INDEX IF NOT EXISTS Comment_entityType_entityId_idx ON Comment(entityType, entityId)`,
  `CREATE TABLE IF NOT EXISTS Document (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileName TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    mimeType TEXT NOT NULL,
    author TEXT NOT NULL,
    projectId TEXT NOT NULL DEFAULT 'default',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS Task (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'a_faire',
    priority TEXT NOT NULL DEFAULT 'normale',
    assignedTo TEXT,
    dueDate DATETIME,
    author TEXT NOT NULL,
    projectId TEXT NOT NULL DEFAULT 'default',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS Activity (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT,
    projectId TEXT NOT NULL DEFAULT 'default',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `DROP TABLE IF EXISTS "Constraint"`,
  `CREATE TABLE "Constraint" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'contractuelle',
    category TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    dueDate DATETIME,
    articleRef TEXT,
    penaltyAmount REAL,
    penaltyUnit TEXT,
    penaltyPer TEXT,
    penaltyFormula TEXT,
    penaltyCap REAL,
    penaltyCapUnit TEXT,
    penaltyDetails TEXT,
    escalation TEXT,
    condition TEXT,
    sourceDocument TEXT,
    occurrences INTEGER NOT NULL DEFAULT 0,
    recurrenceType TEXT,
    recurrenceDay INTEGER,
    resolvedDate DATETIME,
    penaltyStartDate DATETIME,
    responsible TEXT,
    author TEXT NOT NULL,
    projectId TEXT NOT NULL DEFAULT 'default',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

async function main() {
  for (const sql of stmts) {
    try {
      await c.execute(sql);
      console.log("OK:", sql.substring(0, 60));
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log("SKIP:", sql.substring(0, 60));
      } else {
        console.error("ERR:", e.message);
      }
    }
  }

  // Create test user
  const hash = await bcryptjs.hash("6u&eUYMz%BNSZN@7tD%k", 10);
  await c.execute({
    sql: `INSERT OR IGNORE INTO User (id, name, email, password, firstName, lastName) VALUES ('user1', 'Nicolas Vollard', 'nicolas.vollard@gmail.com', ?, 'Nicolas', 'Vollard')`,
    args: [hash],
  });
  console.log("OK: User created");

  // Create default project
  await c.execute(
    `INSERT OR IGNORE INTO Project (id, name, accessCode) VALUES ('default', 'Mon Chantier', '1234')`
  );
  console.log("OK: Project created");

  // Link user to project
  await c.execute(
    `INSERT OR IGNORE INTO UserProject (id, userId, projectId, role) VALUES ('up1', 'user1', 'default', 'admin')`
  );
  console.log("OK: UserProject link created");

  console.log("\nLocal DB setup complete!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
