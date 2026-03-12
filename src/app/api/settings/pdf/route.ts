import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";

export async function GET() {
  try {
    const projectId = await getCurrentProjectId();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { pdfSettings: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    let settings = {};
    try {
      settings = JSON.parse(project.pdfSettings);
    } catch {
      settings = {};
    }

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const projectId = await getCurrentProjectId();
    const body = await request.json();

    // Validate the settings object
    const settings = {
      logoUrl: typeof body.logoUrl === "string" ? body.logoUrl : undefined,
      companyName: typeof body.companyName === "string" ? body.companyName : undefined,
      headerColor: typeof body.headerColor === "string" ? body.headerColor : undefined,
      showCoverPage: typeof body.showCoverPage === "boolean" ? body.showCoverPage : false,
      coverTitle: typeof body.coverTitle === "string" ? body.coverTitle : undefined,
      coverSubtitle: typeof body.coverSubtitle === "string" ? body.coverSubtitle : undefined,
      footerText: typeof body.footerText === "string" ? body.footerText : undefined,
    };

    // Clean undefined keys
    const clean = Object.fromEntries(
      Object.entries(settings).filter(([, v]) => v !== undefined)
    );

    await prisma.project.update({
      where: { id: projectId },
      data: { pdfSettings: JSON.stringify(clean) },
    });

    return NextResponse.json(clean);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
