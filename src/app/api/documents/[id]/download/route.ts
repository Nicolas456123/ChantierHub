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

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    let fileBuffer: ArrayBuffer;

    if (document.filePath.startsWith("/uploads/")) {
      // Local file
      const localPath = path.join(process.cwd(), "public", document.filePath);
      const buffer = await readFile(localPath);
      fileBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
    } else {
      // Vercel Blob
      const blobResponse = await fetch(document.filePath, {
        headers: {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        },
      });

      if (!blobResponse.ok) {
        return NextResponse.json(
          { error: "Fichier introuvable" },
          { status: 404 }
        );
      }

      fileBuffer = await blobResponse.arrayBuffer();
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`,
        "Content-Length": String(fileBuffer.byteLength),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du téléchargement du document" },
      { status: 500 }
    );
  }
}
