import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://chantierhub-nicolas456123.aws-eu-west-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Delete all data but keep table structure
const statements = [
  "DELETE FROM Activity",
  "DELETE FROM Comment",
  "DELETE FROM Event",
  "DELETE FROM Request",
  "DELETE FROM Document",
  "DELETE FROM Task",
  "DELETE FROM UserProject",
  "DELETE FROM Session",
  "DELETE FROM User",
  "DELETE FROM Project",
];

async function main() {
  for (const sql of statements) {
    const result = await client.execute(sql);
    console.log(`OK: ${sql} (${result.rowsAffected} rows)`);
  }

  console.log("\nAll data has been reset!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
