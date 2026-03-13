import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();

    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo || photo.projectId !== projectId) {
      return NextResponse.json(
        { error: "Photo non trouvée" },
        { status: 404 }
      );
    }

    // Delete the actual file
    if (photo.filePath.startsWith("/uploads/")) {
      try {
        await unlink(path.join(process.cwd(), "public", photo.filePath));
      } catch {
        // File may already be deleted
      }
    } else if (photo.filePath.includes("blob.vercel-storage.com")) {
      try {
        const { del } = await import("@vercel/blob");
        await del(photo.filePath);
      } catch {
        // Blob may already be deleted
      }
    }

    await prisma.photo.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la suppression de la photo" },
      { status: 500 }
    );
  }
}
