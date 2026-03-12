import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { notFound } from "next/navigation";
import { MeetingReportEditor } from "./meeting-report-editor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompteRenduDetailPage({ params }: PageProps) {
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

  if (!report) notFound();

  // Get previous report number for carry-over badges
  const previousReport = report.previousId
    ? await prisma.meetingReport.findUnique({
        where: { id: report.previousId },
        select: { number: true },
      })
    : null;

  // Get all companies for reference
  const companies = await prisma.company.findMany({
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

  return (
    <MeetingReportEditor
      report={JSON.parse(JSON.stringify(report))}
      previousReportNumber={previousReport?.number ?? null}
      companies={JSON.parse(JSON.stringify(companies))}
      projectName={project?.name ?? "Projet"}
      pdfSettings={pdfSettings}
    />
  );
}
