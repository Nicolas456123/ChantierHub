import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { documentFolderSchema } from "@/lib/validations";

export async function GET() {
  try {
    const projectId = await getCurrentProjectId();

    const folders = await prisma.documentFolder.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(folders);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = documentFolderSchema.parse(body);

    const folder = await prisma.documentFolder.create({
      data: {
        name: parsed.name,
        parentId: parsed.parentId ?? null,
        projectId,
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("Folder create error:", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 400 });
  }
}
