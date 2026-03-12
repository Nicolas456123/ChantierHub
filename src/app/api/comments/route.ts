import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { commentSchema } from "@/lib/validations";

const VALID_ENTITY_TYPES = ["event", "request", "task", "constraint", "document", "meeting_report"];

export async function GET(request: NextRequest) {
  try {
    await getCurrentProjectId();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType et entityId sont requis" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des commentaires" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = commentSchema.parse(body);

    const { entityType, entityId } = body;

    if (!entityType || !entityId || !VALID_ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json(
        { error: "entityType et entityId sont requis" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content: parsed.content,
        author,
        entityType,
        entityId,
        // Also set requestId for backward compat if it's a request
        ...(entityType === "request" ? { requestId: entityId } : {}),
      },
    });

    await logActivity({
      type: "commentaire",
      description: `a ajouté un commentaire`,
      author,
      entityType: "comment",
      entityId: comment.id,
      projectId,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la création du commentaire" },
      { status: 400 }
    );
  }
}
