import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { documentSchema } from "@/lib/validations";
import { createId } from "@paralleldrive/cuid2";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

export async function GET(request: NextRequest) {
  try {
    const projectId = await getCurrentProjectId();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { projectId };

    if (category) {
      where.category = category;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des documents" },
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
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string;
    const folderId = formData.get("folderId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    const parsed = documentSchema.parse({
      name,
      description: description || undefined,
      category,
    });

    const ext = path.extname(file.name);
    const uniqueName = `${createId()}${ext}`;

    let filePath: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production: upload to Vercel Blob Storage
      const { put } = await import("@vercel/blob");
      const blob = await put(`documents/${uniqueName}`, file, {
        access: "private",
      });
      filePath = blob.url;
    } else {
      // Development: save to local filesystem
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      const localPath = path.join(uploadsDir, uniqueName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(localPath, buffer);
      filePath = `/uploads/${uniqueName}`;
    }

    const document = await prisma.document.create({
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
        category: parsed.category,
        filePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        author,
        folderId: folderId || null,
        projectId,
      },
    });

    await logActivity({
      type: "creation",
      description: `a ajouté le document "${document.name}"`,
      author,
      entityType: "document",
      entityId: document.id,
      projectId,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Document upload error:", message, error);
    return NextResponse.json(
      { error: `Erreur lors de l'ajout du document: ${message}` },
      { status: 400 }
    );
  }
}
