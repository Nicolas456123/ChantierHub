import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor, getCurrentProjectId } from "@/lib/auth";
import { appointmentSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const projectId = await getCurrentProjectId();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // format: YYYY-MM

    const where: Record<string, unknown> = { projectId };

    if (month) {
      const [year, m] = month.split("-").map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(appointments);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const author = await getAuthor();
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = appointmentSchema.parse(body);

    const appointment = await prisma.appointment.create({
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        date: new Date(parsed.date),
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        location: parsed.location ?? null,
        attendees: parsed.attendees ?? "[]",
        color: parsed.color ?? "#f97316",
        author,
        projectId,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("Appointment create error:", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 400 });
  }
}
