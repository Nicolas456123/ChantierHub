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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = constraintSchema.parse(body);

    const existing = await prisma.constraint.findFirst({
      where: { id, projectId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Contrainte non trouvée" },
        { status: 404 }
      );
    }

    const constraint = await prisma.constraint.update({
      where: { id },
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        type: parsed.type,
        status: parsed.status,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        penaltyAmount: parsed.penaltyAmount ?? null,
        penaltyUnit: parsed.penaltyUnit ?? null,
        penaltyDetails: parsed.penaltyDetails ?? null,
        responsible: parsed.responsible ?? null,
      },
    });

    if (existing.status !== parsed.status) {
      const newStatusLabel =
        CONSTRAINT_STATUSES.find((s) => s.value === parsed.status)?.label ??
        parsed.status;
      await logActivity({
        type: "modification",
        description: `a changé le statut de la contrainte "${constraint.title}" en "${newStatusLabel}"`,
        author,
        entityType: "constraint",
        entityId: constraint.id,
        projectId,
      });
    } else {
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
