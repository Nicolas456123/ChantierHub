import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { taskSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const projectId = await getCurrentProjectId();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedTo = searchParams.get("assignedTo");

    const where: Record<string, unknown> = { projectId };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tâches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = taskSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        status: parsed.status,
        priority: parsed.priority,
        assignedTo: parsed.assignedTo ?? null,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        author,
        projectId,
      },
    });

    await logActivity({
      type: "creation",
      description: `a créé la tâche "${task.title}"`,
      author,
      entityType: "task",
      entityId: task.id,
      projectId,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de la tâche" },
      { status: 400 }
    );
  }
}
