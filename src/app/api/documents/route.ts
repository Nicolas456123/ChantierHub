import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { documentSchema } from "@/lib/validations";
import { put } from "@vercel/blob";
import { createId } from "@paralleldrive/cuid2";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};

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
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string;

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

    // Upload to Vercel Blob Storage
    const blob = await put(`documents/${uniqueName}`, file, {
      access: "public",
    });

    const document = await prisma.document.create({
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
        category: parsed.category,
        filePath: blob.url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        author,
      },
    });

    await logActivity({
      type: "creation",
      description: `a ajouté le document "${document.name}"`,
      author,
      entityType: "document",
      entityId: document.id,
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
