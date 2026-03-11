import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { settingsSchema } from "@/lib/validations";

export async function GET() {
  try {
    let project = await prisma.project.findFirst();

    if (!project) {
      project = await prisma.project.create({
        data: { name: "Mon Chantier" },
      });
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
    const body = await request.json();
    const parsed = settingsSchema.parse(body);

    let project = await prisma.project.findFirst();

    if (!project) {
      project = await prisma.project.create({
        data: { name: "Mon Chantier" },
      });
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
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
