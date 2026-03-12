import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log("=== Migration V4 : Pénalités auto + Commentaires universels + Comptes-rendus ===\n");

  // ─── A. Constraint: penalty dates ───
  console.log("A. Contraintes : ajout resolvedDate et penaltyStartDate...");
  const constraintCols = [
    'ALTER TABLE "Constraint" ADD COLUMN resolvedDate DATETIME',
    'ALTER TABLE "Constraint" ADD COLUMN penaltyStartDate DATETIME',
  ];
  for (const sql of constraintCols) {
    try {
      await db.execute(sql);
      const col = sql.match(/ADD COLUMN (\w+)/)?.[1];
      console.log(`  OK: ${col}`);
    } catch (e) {
      if (e.message?.includes("duplicate column")) {
        const col = sql.match(/ADD COLUMN (\w+)/)?.[1];
        console.log(`  SKIP: ${col} (exists)`);
      } else {
        console.error(`  ERROR: ${e.message}`);
      }
    }
  }

  // ─── B. Comment: polymorphic ───
  console.log("\nB. Commentaires : ajout entityType et entityId...");
  const commentCols = [
    'ALTER TABLE "Comment" ADD COLUMN entityType TEXT',
    'ALTER TABLE "Comment" ADD COLUMN entityId TEXT',
  ];
  for (const sql of commentCols) {
    try {
      await db.execute(sql);
      const col = sql.match(/ADD COLUMN (\w+)/)?.[1];
      console.log(`  OK: ${col}`);
    } catch (e) {
      if (e.message?.includes("duplicate column")) {
        const col = sql.match(/ADD COLUMN (\w+)/)?.[1];
        console.log(`  SKIP: ${col} (exists)`);
      } else {
        console.error(`  ERROR: ${e.message}`);
      }
    }
  }

  // Backfill existing comments
  try {
    const result = await db.execute(
      `UPDATE "Comment" SET entityType = 'request', entityId = requestId WHERE entityType IS NULL AND requestId IS NOT NULL`
    );
    console.log(`  Backfill: ${result.rowsAffected} comments updated`);
  } catch (e) {
    console.error(`  Backfill ERROR: ${e.message}`);
  }

  // Index on Comment(entityType, entityId)
  try {
    await db.execute(`CREATE INDEX IF NOT EXISTS "Comment_entityType_entityId_idx" ON "Comment" (entityType, entityId)`);
    console.log("  OK: index Comment(entityType, entityId)");
  } catch (e) {
    console.log(`  SKIP: index (${e.message})`);
  }

  // ─── C. Company table ───
  console.log("\nC. Table Company (annuaire)...");
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS "Company" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lotNumber TEXT,
      lotLabel TEXT,
      contacts TEXT DEFAULT '[]',
      sortOrder INTEGER DEFAULT 0,
      projectId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES "Project"(id) ON DELETE CASCADE
    )`);
    console.log("  OK: Company");
  } catch (e) {
    console.log(`  INFO: ${e.message}`);
  }
  try {
    await db.execute(`CREATE INDEX IF NOT EXISTS "Company_projectId_idx" ON "Company" (projectId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS "Company_projectId_sortOrder_idx" ON "Company" (projectId, sortOrder)`);
    console.log("  OK: indexes");
  } catch (e) {
    console.log(`  INFO: ${e.message}`);
  }

  // ─── D. MeetingReport table ───
  console.log("\nD. Table MeetingReport...");
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS "MeetingReport" (
      id TEXT PRIMARY KEY,
      number INTEGER NOT NULL,
      date DATETIME NOT NULL,
      location TEXT,
      nextMeetingDate DATETIME,
      nextMeetingTime TEXT,
      weather TEXT,
      generalNotes TEXT DEFAULT '{}',
      status TEXT DEFAULT 'brouillon',
      author TEXT NOT NULL,
      previousId TEXT,
      projectId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES "Project"(id) ON DELETE CASCADE
    )`);
    console.log("  OK: MeetingReport");
  } catch (e) {
    console.log(`  INFO: ${e.message}`);
  }
  try {
    await db.execute(`CREATE INDEX IF NOT EXISTS "MeetingReport_projectId_idx" ON "MeetingReport" (projectId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS "MeetingReport_projectId_number_idx" ON "MeetingReport" (projectId, number)`);
    console.log("  OK: indexes");
  } catch (e) {
    console.log(`  INFO: ${e.message}`);
  }

  // ─── E. MeetingAttendance table ───
  console.log("\nE. Table MeetingAttendance...");
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS "MeetingAttendance" (
      id TEXT PRIMARY KEY,
      meetingReportId TEXT NOT NULL,
      companyId TEXT NOT NULL,
      status TEXT DEFAULT 'absent',
      representant TEXT,
      FOREIGN KEY (meetingReportId) REFERENCES "MeetingReport"(id) ON DELETE CASCADE,
      FOREIGN KEY (companyId) REFERENCES "Company"(id) ON DELETE CASCADE,
      UNIQUE(meetingReportId, companyId)
    )`);
    console.log("  OK: MeetingAttendance");
  } catch (e) {
    console.log(`  INFO: ${e.message}`);
  }
  try {
    await db.execute(`CREATE INDEX IF NOT EXISTS "MeetingAttendance_meetingReportId_idx" ON "MeetingAttendance" (meetingReportId)`);
    console.log("  OK: indexes");
  } catch (e) {
    console.log(`  INFO: ${e.message}`);
  }

  // ─── F. MeetingSection table ───
  console.log("\nF. Table MeetingSection...");
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS "MeetingSection" (
      id TEXT PRIMARY KEY,
      meetingReportId TEXT NOT NULL,
      companyId TEXT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '{}',
      sortOrder INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meetingReportId) REFERENCES "MeetingReport"(id) ON DELETE CASCADE,
      FOREIGN KEY (companyId) REFERENCES "Company"(id) ON DELETE SET NULL
    )`);
    console.log("  OK: MeetingSection");
  } catch (e) {
    console.log(`  INFO: ${e.message}`);
  }
  try {
    await db.execute(`CREATE INDEX IF NOT EXISTS "MeetingSection_meetingReportId_idx" ON "MeetingSection" (meetingReportId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS "MeetingSection_meetingReportId_sortOrder_idx" ON "MeetingSection" (meetingReportId, sortOrder)`);
    console.log("  OK: indexes");
  } catch (e) {
    console.log(`  INFO: ${e.message}`);
  }

  // ─── G. Observation table ───
  console.log("\nG. Table Observation...");
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS "Observation" (
      id TEXT PRIMARY KEY,
      meetingReportId TEXT NOT NULL,
      sectionId TEXT,
      companyId TEXT,
      description TEXT NOT NULL,
      category TEXT,
      dueDate DATETIME,
      doneDate DATETIME,
      status TEXT DEFAULT 'en_cours',
      sourceObservationId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meetingReportId) REFERENCES "MeetingReport"(id) ON DELETE CASCADE,
      FOREIGN KEY (sectionId) REFERENCES "MeetingSection"(id) ON DELETE SET NULL,
      FOREIGN KEY (companyId) REFERENCES "Company"(id) ON DELETE SET NULL
    )`);
    console.log("  OK: Observation");
  } catch (e) {
    console.log(`  INFO: ${e.message}`);
  }
  try {
    await db.execute(`CREATE INDEX IF NOT EXISTS "Observation_meetingReportId_idx" ON "Observation" (meetingReportId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS "Observation_companyId_idx" ON "Observation" (companyId)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS "Observation_status_idx" ON "Observation" (status)`);
    console.log("  OK: indexes");
  } catch (e) {
    console.log(`  INFO: ${e.message}`);
  }

  console.log("\n=== Migration V4 terminée! ===");
}

migrate().catch(console.error);
