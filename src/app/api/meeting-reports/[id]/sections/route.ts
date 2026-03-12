import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { title, companyId, content, sortOrder } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Le titre est requis" },
        { status: 400 }
      );
    }

    const section = await prisma.meetingSection.create({
      data: {
        meetingReportId: id,
        companyId: companyId ?? null,
        title,
        content: content ?? "{}",
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erreur lors de la création de la section" },
      { status: 400 }
    );
  }
}
