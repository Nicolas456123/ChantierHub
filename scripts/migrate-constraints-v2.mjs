import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://chantierhub-nicolas456123.aws-eu-west-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const alterStatements = [
  `ALTER TABLE "Constraint" ADD COLUMN category TEXT`,
  `ALTER TABLE "Constraint" ADD COLUMN articleRef TEXT`,
  `ALTER TABLE "Constraint" ADD COLUMN penaltyFormula TEXT`,
  `ALTER TABLE "Constraint" ADD COLUMN penaltyPer TEXT`,
  `ALTER TABLE "Constraint" ADD COLUMN penaltyCap REAL`,
  `ALTER TABLE "Constraint" ADD COLUMN penaltyCapUnit TEXT`,
  `ALTER TABLE "Constraint" ADD COLUMN escalation TEXT`,
  `ALTER TABLE "Constraint" ADD COLUMN "condition" TEXT`,
  `ALTER TABLE "Constraint" ADD COLUMN sourceDocument TEXT`,
];

const backfillStatements = [
  // Backfill category from type for existing rows
  `UPDATE "Constraint" SET category = type WHERE category IS NULL AND type IS NOT NULL`,
  // Backfill penaltyPer from penaltyUnit for existing rows
  `UPDATE "Constraint" SET penaltyPer = penaltyUnit WHERE penaltyPer IS NULL AND penaltyUnit IS NOT NULL`,
];

const indexStatements = [
  `CREATE INDEX IF NOT EXISTS Constraint_category_idx ON "Constraint"(category)`,
];

async function main() {
  console.log("=== Migration Contraintes V2 ===\n");

  // 1. Add new columns
  console.log("1. Ajout des nouvelles colonnes...");
  for (const sql of alterStatements) {
    try {
      await client.execute(sql);
      console.log("  OK:", sql.substring(0, 70));
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        console.log("  SKIP (existe deja):", sql.substring(0, 70));
      } else {
        console.error("  ERROR:", msg);
      }
    }
  }

  // 2. Backfill existing data
  console.log("\n2. Backfill des donnees existantes...");
  for (const sql of backfillStatements) {
    try {
      const result = await client.execute(sql);
      console.log("  OK:", sql.substring(0, 70), `(${result.rowsAffected} rows)`);
    } catch (e) {
      console.error("  ERROR:", e.message);
    }
  }

  // 3. Create indexes
  console.log("\n3. Creation des index...");
  for (const sql of indexStatements) {
    try {
      await client.execute(sql);
      console.log("  OK:", sql.substring(0, 70));
    } catch (e) {
      console.error("  ERROR:", e.message);
    }
  }

  console.log("\nMigration V2 terminee!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
