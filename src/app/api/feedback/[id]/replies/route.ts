import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isGlobalAdmin } from "@/lib/auth";
import { feedbackReplySchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const replies = await prisma.feedbackReply.findMany({
      where: { feedbackId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(replies);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = feedbackReplySchema.parse(body);

    // Check feedback exists
    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      return NextResponse.json({ error: "Retour introuvable" }, { status: 404 });
    }

    // Only owner or admin can reply
    const admin = await isGlobalAdmin();
    if (feedback.userId !== session.user.id && !admin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const reply = await prisma.feedbackReply.create({
      data: {
        content: parsed.content,
        author: `${session.user.firstName} ${session.user.lastName}`,
        feedbackId: id,
      },
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error("Feedback reply error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 400 });
  }
}
