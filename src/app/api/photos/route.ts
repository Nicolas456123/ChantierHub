import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { createId } from "@paralleldrive/cuid2";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

export async function GET(request: NextRequest) {
  try {
    const projectId = await getCurrentProjectId();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType et entityId requis" },
        { status: 400 }
      );
    }

    const photos = await prisma.photo.findMany({
      where: { projectId, entityType, entityId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(photos);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des photos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;
    const caption = formData.get("caption") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType et entityId requis" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une image" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 5 Mo" },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name) || ".jpg";
    const uniqueName = `${createId()}${ext}`;

    let filePath: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`photos/${uniqueName}`, file, {
        access: "private",
      });
      filePath = blob.url;
    } else {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "photos");
      await mkdir(uploadsDir, { recursive: true });
      const localPath = path.join(uploadsDir, uniqueName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(localPath, buffer);
      filePath = `/uploads/photos/${uniqueName}`;
    }

    const photo = await prisma.photo.create({
      data: {
        filePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        caption: caption || null,
        author,
        entityType,
        entityId,
        projectId,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Photo upload error:", message, error);
    return NextResponse.json(
      { error: `Erreur lors de l'upload de la photo: ${message}` },
      { status: 400 }
    );
  }
}
