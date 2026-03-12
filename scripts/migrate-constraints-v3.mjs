import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log("=== Migration Contraintes V3 ===\n");

  // 1. New columns
  console.log("1. Ajout des nouvelles colonnes...");
  const columns = [
    'ALTER TABLE "Constraint" ADD COLUMN occurrences INTEGER DEFAULT 0',
    'ALTER TABLE "Constraint" ADD COLUMN recurrenceType TEXT',
    'ALTER TABLE "Constraint" ADD COLUMN recurrenceDay INTEGER',
  ];

  for (const sql of columns) {
    try {
      await db.execute(sql);
      const colName = sql.match(/ADD COLUMN (\w+)/)?.[1];
      console.log(`  OK: ${colName}`);
    } catch (e) {
      if (e.message?.includes("duplicate column")) {
        const colName = sql.match(/ADD COLUMN (\w+)/)?.[1];
        console.log(`  SKIP: ${colName} (already exists)`);
      } else {
        console.error(`  ERROR: ${e.message}`);
      }
    }
  }

  console.log("\nMigration V3 terminée!");
}

migrate().catch(console.error);
