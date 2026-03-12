import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, PROJECT_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "ID projet requis" }, { status: 400 });
    }

    // Verify user is a member of this project
    const membership = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId } },
      include: { project: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const response = NextResponse.json({
      success: true,
      project: { id: membership.project.id, name: membership.project.name },
    });

    response.cookies.set(PROJECT_COOKIE_NAME, projectId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
