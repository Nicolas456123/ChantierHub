import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGlobalAdmin } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireGlobalAdmin();
    const { id: userId } = await params;
    const body = await request.json();

    const { projectId, role = "member" } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Le projectId est requis" },
        { status: 400 }
      );
    }

    const userProject = await prisma.userProject.upsert({
      where: {
        userId_projectId: { userId, projectId },
      },
      update: { role },
      create: { userId, projectId, role },
    });

    return NextResponse.json(userProject, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Accès refusé") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireGlobalAdmin();
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Le projectId est requis" },
        { status: 400 }
      );
    }

    await prisma.userProject.delete({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Accès refusé") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
