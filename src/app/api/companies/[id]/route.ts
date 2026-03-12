import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { companySchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();

    const company = await prisma.company.findFirst({
      where: { id, projectId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'entreprise" },
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
    const parsed = companySchema.parse(body);

    const existing = await prisma.company.findFirst({
      where: { id, projectId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: parsed.name,
        lotNumber: parsed.lotNumber ?? null,
        lotLabel: parsed.lotLabel ?? null,
        contacts: parsed.contacts ?? "[]",
        sortOrder: parsed.sortOrder ?? 0,
      },
    });

    await logActivity({
      type: "modification",
      description: `a modifié l'entreprise "${company.name}"`,
      author,
      entityType: "company",
      entityId: company.id,
      projectId,
    });

    return NextResponse.json(company);
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'entreprise" },
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

    const company = await prisma.company.findFirst({
      where: { id, projectId },
    });
    if (!company) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    await prisma.company.delete({ where: { id } });

    await logActivity({
      type: "suppression",
      description: `a supprimé l'entreprise "${company.name}"`,
      author,
      entityType: "company",
      entityId: id,
      projectId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'entreprise" },
      { status: 500 }
    );
  }
}
