import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { commentSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const requestExists = await prisma.request.findUnique({
      where: { id },
    });

    if (!requestExists) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { requestId: id },
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = commentSchema.parse(body);

    const requestItem = await prisma.request.findUnique({
      where: { id },
    });

    if (!requestItem) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content: parsed.content,
        author,
        requestId: id,
      },
    });

    await logActivity({
      type: "commentaire",
      description: `a commenté la demande "${requestItem.title}"`,
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
