import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isGlobalAdmin } from "@/lib/auth";
import { feedbackSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const admin = await isGlobalAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};

    // Regular users see only their own feedback
    if (!admin) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(feedbacks);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des retours" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const parsed = feedbackSchema.parse(body);

    const feedback = await prisma.feedback.create({
      data: {
        type: parsed.type,
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority,
        userId,
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du retour" },
      { status: 400 }
    );
  }
}
