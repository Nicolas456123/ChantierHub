import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, PROJECT_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { accessCode } = body;

    if (!accessCode || typeof accessCode !== "string") {
      return NextResponse.json({ error: "Code d'accès requis" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { accessCode: accessCode.trim() },
    });

    if (!project) {
      return NextResponse.json({ error: "Code d'accès incorrect" }, { status: 404 });
    }

    // Check if already a member
    const existing = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId: project.id } },
    });

    if (!existing) {
      await prisma.userProject.create({
        data: { userId, projectId: project.id },
      });
    }

    // Set project cookie
    const response = NextResponse.json({
      success: true,
      project: { id: project.id, name: project.name },
    });

    response.cookies.set(PROJECT_COOKIE_NAME, project.id, {
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
