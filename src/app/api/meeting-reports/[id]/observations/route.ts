import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { observationSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
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

    const observations = await prisma.observation.findMany({
      where: { meetingReportId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(observations);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des observations" },
      { status: 500 }
    );
  }
}

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
    const parsed = observationSchema.parse(body);

    const observation = await prisma.observation.create({
      data: {
        meetingReportId: id,
        sectionId: parsed.sectionId ?? null,
        companyId: parsed.companyId ?? null,
        description: parsed.description,
        category: parsed.category ?? null,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        doneDate: parsed.doneDate ? new Date(parsed.doneDate) : null,
        status: parsed.status ?? "en_cours",
      },
    });

    return NextResponse.json(observation, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erreur lors de la création de l'observation" },
      { status: 400 }
    );
  }
}
