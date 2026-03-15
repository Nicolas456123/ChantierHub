import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, PROJECT_COOKIE_NAME, requireGlobalAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireGlobalAdmin();
    const userId = await getUserId();
    const body = await request.json();
    const { name, accessCode } = body;

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json({ error: "Nom du projet requis" }, { status: 400 });
    }

    if (!accessCode || typeof accessCode !== "string" || accessCode.trim().length < 4) {
      return NextResponse.json({ error: "Code d'accès requis (min. 4 caractères)" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        accessCode: accessCode.trim(),
      },
    });

    // Add creator as admin
    await prisma.userProject.create({
      data: { userId, projectId: project.id, role: "admin" },
    });

    const response = NextResponse.json({
      success: true,
      project: { id: project.id, name: project.name },
    }, { status: 201 });

    response.cookies.set(PROJECT_COOKIE_NAME, project.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "Accès refusé") {
      return NextResponse.json({ error: "Seuls les administrateurs peuvent créer des projets" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
