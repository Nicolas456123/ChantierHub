import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { meetingReportSchema } from "@/lib/validations";

export async function GET() {
  try {
    const projectId = await getCurrentProjectId();

    const reports = await prisma.meetingReport.findMany({
      where: { projectId },
      orderBy: { number: "desc" },
      include: {
        _count: {
          select: {
            observations: {
              where: { status: { in: ["en_cours", "retard", "urgent"] } },
            },
          },
        },
      },
    });

    return NextResponse.json(reports);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des comptes-rendus" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = meetingReportSchema.parse(body);

    // Auto-number: find the last CR for this project
    const lastReport = await prisma.meetingReport.findFirst({
      where: { projectId },
      orderBy: { number: "desc" },
      select: { id: true, number: true },
    });

    const newNumber = (lastReport?.number ?? 0) + 1;

    // Check for default template to pre-fill generalNotes
    let defaultGeneralNotes = parsed.generalNotes ?? "{}";
    if (defaultGeneralNotes === "{}") {
      const defaultTemplate = await prisma.meetingTemplate.findFirst({
        where: { projectId, isDefault: true },
      });
      if (defaultTemplate) {
        defaultGeneralNotes = defaultTemplate.content;
      }
    }

    // Create the meeting report
    const report = await prisma.meetingReport.create({
      data: {
        number: newNumber,
        date: new Date(parsed.date),
        location: parsed.location ?? null,
        nextMeetingDate: parsed.nextMeetingDate
          ? new Date(parsed.nextMeetingDate)
          : null,
        nextMeetingTime: parsed.nextMeetingTime ?? null,
        weather: parsed.weather ?? null,
        generalNotes: defaultGeneralNotes,
        status: parsed.status ?? "brouillon",
        author,
        previousId: lastReport?.id ?? null,
        projectId,
      },
    });

    // Auto carry-over: copy companies as attendances with default status
    const companies = await prisma.company.findMany({
      where: { projectId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    if (companies.length > 0) {
      await prisma.meetingAttendance.createMany({
        data: companies.map((c) => ({
          meetingReportId: report.id,
          companyId: c.id,
          status: "absent",
          representant: "",
        })),
      });

      // Create one section per company
      await prisma.meetingSection.createMany({
        data: companies.map((c, i) => ({
          meetingReportId: report.id,
          companyId: c.id,
          title: c.lotNumber
            ? `Lot ${c.lotNumber} — ${c.name}`
            : c.name,
          content: "{}",
          sortOrder: i,
        })),
      });
    }

    // Auto carry-over: copy open observations from previous CR
    if (lastReport) {
      const openObservations = await prisma.observation.findMany({
        where: {
          meetingReportId: lastReport.id,
          status: { in: ["en_cours", "retard", "urgent"] },
        },
      });

      if (openObservations.length > 0) {
        const now = new Date();
        await prisma.observation.createMany({
          data: openObservations.map((obs) => {
            // Auto-escalate: if dueDate passed and still en_cours, mark as retard
            let newStatus = obs.status;
            if (
              obs.status === "en_cours" &&
              obs.dueDate &&
              new Date(obs.dueDate) < now
            ) {
              newStatus = "retard";
            }

            return {
              meetingReportId: report.id,
              sectionId: null, // will be linked to section when editing
              companyId: obs.companyId,
              description: obs.description,
              category: obs.category,
              dueDate: obs.dueDate,
              doneDate: null,
              status: newStatus,
              sourceObservationId: obs.sourceObservationId ?? obs.id,
            };
          }),
        });
      }
    }

    await logActivity({
      type: "creation",
      description: `a créé le compte-rendu n°${newNumber}`,
      author,
      entityType: "meeting_report",
      entityId: report.id,
      projectId,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du compte-rendu" },
      { status: 400 }
    );
  }
}
