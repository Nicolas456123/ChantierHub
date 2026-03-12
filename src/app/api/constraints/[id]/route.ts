import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { constraintSchema } from "@/lib/validations";
import { CONSTRAINT_STATUSES } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();

    const constraint = await prisma.constraint.findFirst({
      where: { id, projectId },
    });

    if (!constraint) {
      return NextResponse.json(
        { error: "Contrainte non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(constraint);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la contrainte" },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const body = await request.json();

    const existing = await prisma.constraint.findFirst({
      where: { id, projectId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Contrainte non trouvée" },
        { status: 404 }
      );
    }

    // Support partial update (status-only) or full update
    const isStatusOnly = Object.keys(body).length === 1 && body.status;

    let updateData;
    if (isStatusOnly) {
      const validStatuses = ["active", "respectee", "non_respectee"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Statut invalide" },
          { status: 400 }
        );
      }
      updateData = { status: body.status };
    } else if (Object.keys(body).length === 1 && body.occurrences !== undefined) {
      // Partial update: occurrences only
      updateData = { occurrences: Math.max(0, parseInt(body.occurrences) || 0) };
    } else if (Object.keys(body).length === 1 && body.resolvedDate !== undefined) {
      // Partial update: resolvedDate only (from penalty calculator)
      updateData = { resolvedDate: body.resolvedDate ? new Date(body.resolvedDate) : null };
    } else {
      const parsed = constraintSchema.parse(body);
      updateData = {
        title: parsed.title,
        description: parsed.description ?? null,
        type: parsed.type || categoryToType(parsed.category),
        category: parsed.category,
        status: parsed.status,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        articleRef: parsed.articleRef ?? null,
        penaltyAmount: parsed.penaltyAmount ?? null,
        penaltyUnit: parsed.penaltyPer ?? parsed.penaltyUnit ?? null,
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
        resolvedDate: parsed.resolvedDate ? new Date(parsed.resolvedDate) : null,
        penaltyStartDate: parsed.penaltyStartDate ? new Date(parsed.penaltyStartDate) : null,
        responsible: parsed.responsible ?? null,
      };
    }

    const constraint = await prisma.constraint.update({
      where: { id },
      data: updateData,
    });

    const newStatus = isStatusOnly ? body.status : updateData.status;
    if (existing.status !== newStatus) {
      const newStatusLabel =
        CONSTRAINT_STATUSES.find((s) => s.value === newStatus)?.label ??
        newStatus;
      await logActivity({
        type: "modification",
        description: `a changé le statut de la contrainte "${constraint.title}" en "${newStatusLabel}"`,
        author,
        entityType: "constraint",
        entityId: constraint.id,
        projectId,
      });
    } else if (!isStatusOnly) {
      await logActivity({
        type: "modification",
        description: `a modifié la contrainte "${constraint.title}"`,
        author,
        entityType: "constraint",
        entityId: constraint.id,
        projectId,
      });
    }

    return NextResponse.json(constraint);
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la contrainte" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();

    const constraint = await prisma.constraint.findFirst({
      where: { id, projectId },
    });
    if (!constraint) {
      return NextResponse.json(
        { error: "Contrainte non trouvée" },
        { status: 404 }
      );
    }

    await prisma.constraint.delete({ where: { id } });

    await logActivity({
      type: "suppression",
      description: `a supprimé la contrainte "${constraint.title}"`,
      author,
      entityType: "constraint",
      entityId: id,
      projectId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la suppression de la contrainte" },
      { status: 500 }
    );
  }
}
