import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { documentFolderSchema } from "@/lib/validations";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = documentFolderSchema.parse(body);

    const existing = await prisma.documentFolder.findFirst({ where: { id, projectId } });
    if (!existing) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    const updated = await prisma.documentFolder.update({
      where: { id },
      data: { name: parsed.name, parentId: parsed.parentId ?? null },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();

    const existing = await prisma.documentFolder.findFirst({ where: { id, projectId } });
    if (!existing) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    // Move documents in this folder to root (no folder)
    await prisma.document.updateMany({
      where: { folderId: id, projectId },
      data: { folderId: null },
    });

    // Move sub-folders to parent
    await prisma.documentFolder.updateMany({
      where: { parentId: id, projectId },
      data: { parentId: existing.parentId },
    });

    await prisma.documentFolder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
