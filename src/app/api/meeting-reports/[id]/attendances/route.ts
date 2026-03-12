import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";

// Bulk update attendances for a meeting report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { attendances } = body as {
      attendances: {
        companyId: string;
        status: string;
        representant?: string;
      }[];
    };

    if (!Array.isArray(attendances)) {
      return NextResponse.json(
        { error: "Format invalide" },
        { status: 400 }
      );
    }

    const validStatuses = ["present", "absent", "excuse", "non_convoque"];

    // Upsert each attendance
    for (const att of attendances) {
      if (!validStatuses.includes(att.status)) continue;

      await prisma.meetingAttendance.upsert({
        where: {
          meetingReportId_companyId: {
            meetingReportId: id,
            companyId: att.companyId,
          },
        },
        update: {
          status: att.status,
          representant: att.representant ?? "",
        },
        create: {
          meetingReportId: id,
          companyId: att.companyId,
          status: att.status,
          representant: att.representant ?? "",
        },
      });
    }

    // Return updated list
    const updated = await prisma.meetingAttendance.findMany({
      where: { meetingReportId: id },
      include: { company: true },
      orderBy: { company: { sortOrder: "asc" } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des présences" },
      { status: 400 }
    );
  }
}
