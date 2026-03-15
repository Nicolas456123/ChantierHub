import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { MeetingReportPDF } from "@/lib/pdf/meeting-report-pdf";

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
          orderBy: { company: { lotNumber: "asc" } },
        },
        sections: {
          include: { company: true },
          orderBy: { company: { lotNumber: "asc" } },
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

    // Get all companies for the full contact list
    const allCompanies = await prisma.company.findMany({
      where: { projectId },
      orderBy: [{ lotNumber: "asc" }, { name: "asc" }],
    });

    // Get project name and PDF settings
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, pdfSettings: true },
    });

    let pdfSettings = {};
    try {
      pdfSettings = JSON.parse(project?.pdfSettings ?? "{}");
    } catch {
      pdfSettings = {};
    }

    // Get previous report number
    const previousReport = report.previousId
      ? await prisma.meetingReport.findUnique({
          where: { id: report.previousId },
          select: { number: true },
        })
      : null;

    // Serialize dates for the component
    const serialized = JSON.parse(JSON.stringify(report));

    const buffer = await renderToBuffer(
      <MeetingReportPDF
        report={serialized}
        companies={JSON.parse(JSON.stringify(allCompanies))}
        projectName={project?.name ?? "Projet"}
        previousReportNumber={previousReport?.number ?? null}
        pdfSettings={pdfSettings}
      />
    );

    const filename = `CR_${report.number}_${new Date(report.date)
      .toISOString()
      .split("T")[0]}.pdf`;

    // Convert Node.js Buffer to Uint8Array for NextResponse compatibility
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}
