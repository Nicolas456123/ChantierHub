import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { companySchema } from "@/lib/validations";

export async function GET() {
  try {
    const projectId = await getCurrentProjectId();

    const companies = await prisma.company.findMany({
      where: { projectId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(companies);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des entreprises" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = companySchema.parse(body);

    const company = await prisma.company.create({
      data: {
        name: parsed.name,
        lotNumber: parsed.lotNumber ?? null,
        lotLabel: parsed.lotLabel ?? null,
        contacts: parsed.contacts ?? "[]",
        sortOrder: parsed.sortOrder ?? 0,
        projectId,
      },
    });

    await logActivity({
      type: "creation",
      description: `a ajouté l'entreprise "${company.name}" à l'annuaire`,
      author,
      entityType: "company",
      entityId: company.id,
      projectId,
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de l'entreprise" },
      { status: 400 }
    );
  }
}
