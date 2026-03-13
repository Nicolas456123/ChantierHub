import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { unlink } from "fs/promises";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document || document.projectId !== projectId) {
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
    const projectId = await getCurrentProjectId();

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document || document.projectId !== projectId) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Delete the actual file
    if (document.filePath.startsWith("/uploads/")) {
      // Local file
      try {
        await unlink(path.join(process.cwd(), "public", document.filePath));
      } catch {
        // File may already be deleted, continue
      }
    } else if (document.filePath.includes("blob.vercel-storage.com")) {
      // Vercel Blob
      try {
        const { del } = await import("@vercel/blob");
        await del(document.filePath);
      } catch {
        // Blob may already be deleted, continue
      }
    }

    await prisma.document.delete({ where: { id } });

    await logActivity({
      type: "suppression",
      description: `a supprimé le document "${document.name}"`,
      author,
      entityType: "document",
      entityId: id,
      projectId,
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
