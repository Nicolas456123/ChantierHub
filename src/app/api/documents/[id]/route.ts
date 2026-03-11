import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import path from "path";
import { unlink } from "fs/promises";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération du document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const author = await getAuthor();

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    const filePath = path.join(process.cwd(), "public", document.filePath);
    try {
      await unlink(filePath);
    } catch {
      // File may already be deleted, continue with record removal
    }

    await prisma.document.delete({ where: { id } });

    await logActivity({
      type: "suppression",
      description: `a supprimé le document "${document.name}"`,
      author,
      entityType: "document",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la suppression du document" },
      { status: 500 }
    );
  }
}
