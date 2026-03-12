import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";

// GET /api/meeting-templates — List all templates for the project
export async function GET() {
  try {
    const projectId = await getCurrentProjectId();
    const templates = await prisma.meetingTemplate.findMany({
      where: { projectId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching meeting templates:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/meeting-templates — Create a new template
export async function POST(request: NextRequest) {
  try {
    const projectId = await getCurrentProjectId();
    const body = await request.json();

    const { name, content, isDefault } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await prisma.meetingTemplate.updateMany({
        where: { projectId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.meetingTemplate.create({
      data: {
        name: name.trim(),
        content: content || "{}",
        isDefault: isDefault || false,
        projectId,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting template:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
