import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { meetingReportSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();

    const report = await prisma.meetingReport.findFirst({
      where: { id, projectId },
      include: {
        attendances: {
          include: { company: true },
          orderBy: { company: { sortOrder: "asc" } },
        },
        sections: {
          include: { company: true },
          orderBy: { sortOrder: "asc" },
        },
        observations: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Compte-rendu non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération du compte-rendu" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const body = await request.json();

    const existing = await prisma.meetingReport.findFirst({
      where: { id, projectId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Compte-rendu non trouvé" },
        { status: 404 }
      );
    }

    // Support partial updates
    const isStatusOnly = Object.keys(body).length === 1 && body.status;
    const isGeneralNotesOnly =
      Object.keys(body).length === 1 && body.generalNotes !== undefined;

    let updateData;
    if (isStatusOnly) {
      const valid = ["brouillon", "valide", "diffuse"];
      if (!valid.includes(body.status)) {
        return NextResponse.json(
          { error: "Statut invalide" },
          { status: 400 }
        );
      }
      updateData = { status: body.status };
    } else if (isGeneralNotesOnly) {
      updateData = { generalNotes: body.generalNotes };
    } else {
      const parsed = meetingReportSchema.parse(body);
      updateData = {
        date: new Date(parsed.date),
        location: parsed.location ?? null,
        nextMeetingDate: parsed.nextMeetingDate
          ? new Date(parsed.nextMeetingDate)
          : null,
        nextMeetingTime: parsed.nextMeetingTime ?? null,
        weather: parsed.weather ?? null,
        generalNotes: parsed.generalNotes ?? "{}",
        status: parsed.status ?? existing.status,
      };
    }

    const report = await prisma.meetingReport.update({
      where: { id },
      data: updateData,
    });

    if (!isGeneralNotesOnly) {
      await logActivity({
        type: "modification",
        description: `a modifié le compte-rendu n°${report.number}`,
        author,
        entityType: "meeting_report",
        entityId: report.id,
        projectId,
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du compte-rendu" },
      { status: 400 }
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

    const report = await prisma.meetingReport.findFirst({
      where: { id, projectId },
    });
    if (!report) {
      return NextResponse.json(
        { error: "Compte-rendu non trouvé" },
        { status: 404 }
      );
    }

    // Delete associated data first
    await prisma.observation.deleteMany({ where: { meetingReportId: id } });
    await prisma.meetingSection.deleteMany({ where: { meetingReportId: id } });
    await prisma.meetingAttendance.deleteMany({
      where: { meetingReportId: id },
    });
    await prisma.meetingReport.delete({ where: { id } });

    await logActivity({
      type: "suppression",
      description: `a supprimé le compte-rendu n°${report.number}`,
      author,
      entityType: "meeting_report",
      entityId: id,
      projectId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erreur lors de la suppression du compte-rendu" },
      { status: 500 }
    );
  }
}
