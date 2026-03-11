import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { accessCodeSchema } from "@/lib/validations";

export async function PUT(request: NextRequest) {
  try {
    const author = await getAuthor();
    const body = await request.json();
    const parsed = accessCodeSchema.parse(body);

    let project = await prisma.project.findFirst();

    if (!project) {
      project = await prisma.project.create({
        data: { name: "Mon Chantier" },
      });
    }

    if (project.accessCode !== parsed.currentCode) {
      return NextResponse.json(
        { error: "Le code actuel est incorrect" },
        { status: 400 }
      );
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        accessCode: parsed.newCode,
      },
    });

    await logActivity({
      type: "modification",
      description: `a changé le code d'accès du projet`,
      author,
      entityType: "project",
      entityId: updated.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors du changement du code d'accès" },
      { status: 400 }
    );
  }
}
