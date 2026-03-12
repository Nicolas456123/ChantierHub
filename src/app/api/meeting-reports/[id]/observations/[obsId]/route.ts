import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { observationSchema } from "@/lib/validations";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; obsId: string }> }
) {
  try {
    const { id, obsId } = await params;
    const projectId = await getCurrentProjectId();

    const report = await prisma.meetingReport.findFirst({
      where: { id, projectId },
    });
    if (!report) {
      return NextResponse.json(
        { error: "Compte-rendu non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = observationSchema.parse(body);

    const observation = await prisma.observation.update({
      where: { id: obsId },
      data: {
        description: parsed.description,
        category: parsed.category ?? null,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        doneDate: parsed.doneDate ? new Date(parsed.doneDate) : null,
        status: parsed.status ?? "en_cours",
        companyId: parsed.companyId ?? null,
        sectionId: parsed.sectionId ?? null,
      },
    });

    return NextResponse.json(observation);
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'observation" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; obsId: string }> }
) {
  try {
    const { id, obsId } = await params;
    const projectId = await getCurrentProjectId();

    const report = await prisma.meetingReport.findFirst({
      where: { id, projectId },
    });
    if (!report) {
      return NextResponse.json(
        { error: "Compte-rendu non trouvé" },
        { status: 404 }
      );
    }

    await prisma.observation.delete({ where: { id: obsId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'observation" },
      { status: 500 }
    );
  }
}
