import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eventSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event || event.projectId !== projectId) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'événement" },
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
    const parsed = eventSchema.parse(body);

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing || existing.projectId !== projectId) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        category: parsed.category,
        date: parsed.date ? new Date(parsed.date) : existing.date,
        priority: parsed.priority,
      },
    });

    await logActivity({
      type: "modification",
      description: `a modifié l'événement "${event.title}"`,
      author,
      entityType: "event",
      entityId: event.id,
      projectId,
    });

    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'événement" },
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

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.projectId !== projectId) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    await prisma.event.delete({ where: { id } });

    await logActivity({
      type: "suppression",
      description: `a supprimé l'événement "${event.title}"`,
      author,
      entityType: "event",
      entityId: id,
      projectId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'événement" },
      { status: 500 }
    );
  }
}
