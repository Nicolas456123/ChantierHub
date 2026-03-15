import { createClient } from "@libsql/client";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "dev.db");

const client = createClient({ url: `file:${dbPath}` });

const statements = [
  // FeedbackReply table
  `CREATE TABLE IF NOT EXISTS "FeedbackReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedbackReply_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "FeedbackReply_feedbackId_idx" ON "FeedbackReply"("feedbackId")`,

  // Appointment table
  `CREATE TABLE IF NOT EXISTS "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "endDate" DATETIME,
    "location" TEXT,
    "attendees" TEXT NOT NULL DEFAULT '[]',
    "color" TEXT NOT NULL DEFAULT '#f97316',
    "author" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Appointment_projectId_idx" ON "Appointment"("projectId")`,
  `CREATE INDEX IF NOT EXISTS "Appointment_date_idx" ON "Appointment"("date")`,

  // DocumentFolder table
  `CREATE TABLE IF NOT EXISTS "DocumentFolder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentFolder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "DocumentFolder_projectId_idx" ON "DocumentFolder"("projectId")`,
  `CREATE INDEX IF NOT EXISTS "DocumentFolder_parentId_idx" ON "DocumentFolder"("parentId")`,
];

for (const sql of statements) {
  await client.execute(sql);
}

// Add folderId to Document if not exists
try {
  await client.execute(`ALTER TABLE "Document" ADD COLUMN "folderId" TEXT`);
  await client.execute(`CREATE INDEX IF NOT EXISTS "Document_folderId_idx" ON "Document"("folderId")`);
  console.log("Added folderId column to Document table");
} catch (e) {
  if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
    console.log("folderId column already exists on Document");
  } else {
    console.log("Note:", e.message);
  }
}

console.log("Migration completed successfully!");
