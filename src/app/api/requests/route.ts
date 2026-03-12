import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { requestSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const projectId = await getCurrentProjectId();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = { projectId };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des demandes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = requestSchema.parse(body);

    const newRequest = await prisma.request.create({
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        type: parsed.type,
        status: parsed.status ?? "en_attente",
        assignedTo: parsed.assignedTo ?? null,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        author,
        projectId,
      },
    });

    await logActivity({
      type: "creation",
      description: `a créé la demande "${newRequest.title}"`,
      author,
      entityType: "request",
      entityId: newRequest.id,
      projectId,
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de la demande" },
      { status: 400 }
    );
  }
}
