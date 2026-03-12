import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { id, sectionId } = await params;
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
    const { title, content, sortOrder } = body;

    const section = await prisma.meetingSection.update({
      where: { id: sectionId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la section" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { id, sectionId } = await params;
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

    await prisma.meetingSection.delete({ where: { id: sectionId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la section" },
      { status: 500 }
    );
  }
}
