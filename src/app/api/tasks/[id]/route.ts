import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { taskSchema } from "@/lib/validations";
import { TASK_STATUSES } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la tâche" },
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
    const body = await request.json();
    const parsed = taskSchema.parse(body);

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      );
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        status: parsed.status,
        priority: parsed.priority,
        assignedTo: parsed.assignedTo ?? null,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      },
    });

    if (existing.status !== parsed.status) {
      const newStatusLabel =
        TASK_STATUSES.find((s) => s.value === parsed.status)?.label ??
        parsed.status;
      await logActivity({
        type: "modification",
        description: `a changé le statut de la tâche "${task.title}" en "${newStatusLabel}"`,
        author,
        entityType: "task",
        entityId: task.id,
      });
    } else {
      await logActivity({
        type: "modification",
        description: `a modifié la tâche "${task.title}"`,
        author,
        entityType: "task",
        entityId: task.id,
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la tâche" },
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

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      );
    }

    await prisma.task.delete({ where: { id } });

    await logActivity({
      type: "suppression",
      description: `a supprimé la tâche "${task.title}"`,
      author,
      entityType: "task",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la suppression de la tâche" },
      { status: 500 }
    );
  }
}
