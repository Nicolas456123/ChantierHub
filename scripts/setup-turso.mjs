import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://chantierhub-nicolas456123.aws-eu-west-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
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
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS Event (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    author TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normale',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS Event_date_idx ON Event(date)`,
  `CREATE INDEX IF NOT EXISTS Event_category_idx ON Event(category)`,
  `CREATE TABLE IF NOT EXISTS Request (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en_attente',
    author TEXT NOT NULL,
    assignedTo TEXT,
    dueDate DATETIME,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS Request_status_idx ON Request(status)`,
  `CREATE TABLE IF NOT EXISTS Comment (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    requestId TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requestId) REFERENCES Request(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS Comment_requestId_idx ON Comment(requestId)`,
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
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS Document_category_idx ON Document(category)`,
  `CREATE TABLE IF NOT EXISTS Task (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'a_faire',
    priority TEXT NOT NULL DEFAULT 'normale',
    assignedTo TEXT,
    dueDate DATETIME,
    author TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS Task_status_idx ON Task(status)`,
  `CREATE INDEX IF NOT EXISTS Task_priority_idx ON Task(priority)`,
  `CREATE TABLE IF NOT EXISTS Activity (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS Activity_createdAt_idx ON Activity(createdAt)`,
  `CREATE INDEX IF NOT EXISTS Activity_entityType_idx ON Activity(entityType)`,
];

async function main() {
  for (const sql of statements) {
    await client.execute(sql);
    console.log("OK:", sql.substring(0, 50) + "...");
  }

  await client.execute(
    "INSERT OR IGNORE INTO Project (id, name, accessCode) VALUES ('default', 'Mon Chantier', '1234')"
  );
  console.log("OK: Default project inserted");
  console.log("\nAll tables created successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
