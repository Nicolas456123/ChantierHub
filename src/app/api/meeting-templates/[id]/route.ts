import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";

// PUT /api/meeting-templates/[id] — Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();
    const body = await request.json();

    const existing = await prisma.meetingTemplate.findFirst({
      where: { id, projectId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.content !== undefined) data.content = body.content;
    if (body.isDefault !== undefined) {
      if (body.isDefault) {
        await prisma.meetingTemplate.updateMany({
          where: { projectId, isDefault: true },
          data: { isDefault: false },
        });
      }
      data.isDefault = body.isDefault;
    }

    const updated = await prisma.meetingTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating meeting template:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/meeting-templates/[id] — Delete a template
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();

    const existing = await prisma.meetingTemplate.findFirst({
      where: { id, projectId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    await prisma.meetingTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meeting template:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
