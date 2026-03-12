import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getUserId();

    const userProjects = await prisma.userProject.findMany({
      where: { userId },
      include: { project: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      userProjects.map((up) => ({
        id: up.project.id,
        name: up.project.name,
        description: up.project.description,
        role: up.role,
      }))
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
