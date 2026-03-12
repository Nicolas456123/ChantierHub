import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { settingsSchema } from "@/lib/validations";

export async function GET() {
  try {
    const projectId = await getCurrentProjectId();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des paramètres" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = settingsSchema.parse(body);

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
        startDate: parsed.startDate ? new Date(parsed.startDate) : null,
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        address: parsed.address ?? null,
      },
    });

    await logActivity({
      type: "modification",
      description: `a modifié les paramètres du projet`,
      author,
      entityType: "project",
      entityId: updated.id,
      projectId,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des paramètres" },
      { status: 400 }
    );
  }
}
