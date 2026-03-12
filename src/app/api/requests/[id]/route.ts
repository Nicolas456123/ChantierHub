import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { requestSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();

    const requestItem = await prisma.request.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!requestItem || requestItem.projectId !== projectId) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(requestItem);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la demande" },
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
    const parsed = requestSchema.parse(body);

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing || existing.projectId !== projectId) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );
    }

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        type: parsed.type,
        status: parsed.status ?? existing.status,
        assignedTo: parsed.assignedTo ?? null,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      },
    });

    if (parsed.status && parsed.status !== existing.status) {
      await logActivity({
        type: "changement_statut",
        description: `a changé le statut de la demande "${updatedRequest.title}" de "${existing.status}" à "${parsed.status}"`,
        author,
        entityType: "request",
        entityId: updatedRequest.id,
        projectId,
      });
    } else {
      await logActivity({
        type: "modification",
        description: `a modifié la demande "${updatedRequest.title}"`,
        author,
        entityType: "request",
        entityId: updatedRequest.id,
        projectId,
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la demande" },
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

    const existing = await prisma.request.findUnique({ where: { id } });

    if (!existing || existing.projectId !== projectId) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );
    }

    await prisma.request.delete({ where: { id } });

    await logActivity({
      type: "suppression",
      description: `a supprimé la demande "${existing.title}"`,
      author,
      entityType: "request",
      entityId: id,
      projectId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la suppression de la demande" },
      { status: 500 }
    );
  }
}
