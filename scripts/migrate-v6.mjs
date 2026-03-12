// Migration v6: Add pdfSettings to Project
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const migrations = [
  `ALTER TABLE Project ADD COLUMN pdfSettings TEXT NOT NULL DEFAULT '{}'`,
];

async function main() {
  for (const sql of migrations) {
    try {
      console.log(`Running: ${sql.substring(0, 80)}...`);
      await db.execute(sql);
      console.log("  ✓ Success");
    } catch (err) {
      if (err.message?.includes("duplicate column")) {
        console.log("  ⏭ Already exists, skipping");
      } else {
        console.error("  ✗ Error:", err.message);
      }
    }
  }
  console.log("\nMigration v6 complete!");
}

main().catch(console.error);
