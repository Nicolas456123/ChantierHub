import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.project.findFirst();
  if (!existing) {
    await prisma.project.create({
      data: {
        name: "Mon Chantier",
        description: "Projet de construction",
        accessCode: "1234",
      },
    });
    console.log("Projet par défaut créé (code d'accès: 1234)");
  } else {
    console.log("Projet existant trouvé, seed ignoré.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
