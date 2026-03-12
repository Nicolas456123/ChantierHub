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
    const settings: Record<string, unknown> = {
      logoUrl: typeof body.logoUrl === "string" ? body.logoUrl : undefined,
      companyName: typeof body.companyName === "string" ? body.companyName : undefined,
      companyAddress: typeof body.companyAddress === "string" ? body.companyAddress : undefined,
      headerColor: typeof body.headerColor === "string" ? body.headerColor : undefined,
      showCoverPage: typeof body.showCoverPage === "boolean" ? body.showCoverPage : false,
      coverTitle: typeof body.coverTitle === "string" ? body.coverTitle : undefined,
      coverSubtitle: typeof body.coverSubtitle === "string" ? body.coverSubtitle : undefined,
      footerText: typeof body.footerText === "string" ? body.footerText : undefined,
      sitePhotoUrl: typeof body.sitePhotoUrl === "string" ? body.sitePhotoUrl : undefined,
      siteAddress: typeof body.siteAddress === "string" ? body.siteAddress : undefined,
      projectDescription: typeof body.projectDescription === "string" ? body.projectDescription : undefined,
      columnWidths: body.columnWidths && typeof body.columnWidths === "object" ? body.columnWidths : undefined,
      fontFamily: typeof body.fontFamily === "string" ? body.fontFamily : undefined,
      showContacts: typeof body.showContacts === "boolean" ? body.showContacts : undefined,
      showConvocation: typeof body.showConvocation === "boolean" ? body.showConvocation : undefined,
      visibleCategories: Array.isArray(body.visibleCategories) ? body.visibleCategories : undefined,
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
