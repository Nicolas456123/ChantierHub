import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { code, pseudo } = parsed.data;

    const project = await prisma.project.findFirst();
    if (!project) {
      return NextResponse.json({ error: "Projet non configuré" }, { status: 500 });
    }

    if (code !== project.accessCode) {
      return NextResponse.json({ error: "Code d'accès incorrect" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, projectName: project.name });

    response.cookies.set("chantierhub-auth", "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    response.cookies.set("chantierhub-pseudo", pseudo, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
