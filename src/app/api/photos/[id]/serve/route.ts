import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json(
        { error: "Photo non trouvée" },
        { status: 404 }
      );
    }

    // Vercel Blob (private): use SDK get() for authenticated access
    if (photo.filePath.includes("blob.vercel-storage.com")) {
      const { get } = await import("@vercel/blob");
      const result = await get(photo.filePath, { access: "private" });

      if (!result || result.statusCode !== 200) {
        return NextResponse.json(
          { error: "Fichier introuvable dans le storage" },
          { status: 404 }
        );
      }

      return new NextResponse(result.stream, {
        headers: {
          "Content-Type": photo.mimeType,
          "Content-Disposition": `inline; filename="${photo.fileName}"`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Local file: serve directly
    if (photo.filePath.startsWith("/uploads/")) {
      const fullPath = path.join(process.cwd(), "public", photo.filePath);
      const buffer = await readFile(fullPath);

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": photo.mimeType,
          "Content-Disposition": `inline; filename="${photo.fileName}"`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la photo" },
      { status: 500 }
    );
  }
}
