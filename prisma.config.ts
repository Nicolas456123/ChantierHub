import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrate: {
    async adapter() {
      const { PrismaLibSql } = await import("@prisma/adapter-libsql");
      return new PrismaLibSql({
        url: "file:./prisma/dev.db",
      });
    },
  },
});
