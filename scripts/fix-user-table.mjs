import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://chantierhub-nicolas456123.aws-eu-west-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Since all data was reset, we can safely recreate the User table
// with the correct schema (firstName + lastName, no name column)
const statements = [
  // Drop old tables that reference User
  `DROP TABLE IF EXISTS Session`,
  `DROP TABLE IF EXISTS UserProject`,
  `DROP TABLE IF EXISTS User`,

  // Recreate User with correct schema
  `CREATE TABLE User (
    id TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX User_email_key ON User(email)`,

  // Recreate Session
  `CREATE TABLE Session (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX Session_userId_idx ON Session(userId)`,

  // Recreate UserProject
  `CREATE TABLE UserProject (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    projectId TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
  )`,
  `CREATE UNIQUE INDEX UserProject_userId_projectId_key ON UserProject(userId, projectId)`,
  `CREATE INDEX UserProject_userId_idx ON UserProject(userId)`,
  `CREATE INDEX UserProject_projectId_idx ON UserProject(projectId)`,
];

async function main() {
  for (const sql of statements) {
    try {
      await client.execute(sql);
      console.log("OK:", sql.substring(0, 60) + "...");
    } catch (e) {
      console.error("ERROR:", e.message);
      console.error("SQL:", sql.substring(0, 80));
    }
  }

  console.log("\nUser table fixed! You can now register.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
