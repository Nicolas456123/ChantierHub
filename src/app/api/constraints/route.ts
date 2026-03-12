import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { constraintSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const projectId = await getCurrentProjectId();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { projectId };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { articleRef: { contains: search } },
        { responsible: { contains: search } },
      ];
    }

    const constraints = await prisma.constraint.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(constraints);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des contraintes" },
      { status: 500 }
    );
  }
}

// Map new categories to old type values for backward compat
function categoryToType(category: string): string {
  const contractuelleCategories = [
    "retard_execution", "livrables_documentaires", "sous_traitance",
    "personnel_detachement", "contractuelle",
  ];
  const reglementaireCategories = [
    "securite", "hygiene", "environnement", "dechets", "reglementaire",
  ];
  if (contractuelleCategories.includes(category)) return "contractuelle";
  if (reglementaireCategories.includes(category)) return "reglementaire";
  return "technique";
}

export async function POST(request: NextRequest) {
  try {
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = constraintSchema.parse(body);

    const constraint = await prisma.constraint.create({
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        type: parsed.type || categoryToType(parsed.category),
        category: parsed.category,
        status: parsed.status,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        articleRef: parsed.articleRef ?? null,
        penaltyAmount: parsed.penaltyAmount ?? null,
        penaltyUnit: parsed.penaltyPer ?? parsed.penaltyUnit ?? null, // backward compat
        penaltyPer: parsed.penaltyPer ?? null,
        penaltyFormula: parsed.penaltyFormula ?? null,
        penaltyCap: parsed.penaltyCap ?? null,
        penaltyCapUnit: parsed.penaltyCapUnit ?? null,
        penaltyDetails: parsed.penaltyDetails ?? null,
        escalation: parsed.escalation ?? null,
        condition: parsed.condition ?? null,
        sourceDocument: parsed.sourceDocument ?? null,
        occurrences: parsed.occurrences ?? 0,
        recurrenceType: parsed.recurrenceType ?? null,
        recurrenceDay: parsed.recurrenceDay ?? null,
        responsible: parsed.responsible ?? null,
        author,
        projectId,
      },
    });

    await logActivity({
      type: "creation",
      description: `a créé la contrainte "${constraint.title}"`,
      author,
      entityType: "constraint",
      entityId: constraint.id,
      projectId,
    });

    return NextResponse.json(constraint, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de la contrainte" },
      { status: 400 }
    );
  }
}
