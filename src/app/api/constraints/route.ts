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
    const type = searchParams.get("type");

    const where: Record<string, unknown> = { projectId };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
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
        type: parsed.type,
        status: parsed.status,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        penaltyAmount: parsed.penaltyAmount ?? null,
        penaltyUnit: parsed.penaltyUnit ?? null,
        penaltyDetails: parsed.penaltyDetails ?? null,
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
