import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { appointmentSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();

    const appointment = await prisma.appointment.findFirst({
      where: { id, projectId },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();
    const body = await request.json();
    const parsed = appointmentSchema.parse(body);

    const existing = await prisma.appointment.findFirst({ where: { id, projectId } });
    if (!existing) {
      return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        date: new Date(parsed.date),
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        location: parsed.location ?? null,
        attendees: parsed.attendees ?? "[]",
        color: parsed.color ?? "#f97316",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Appointment update error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = await getCurrentProjectId();

    const existing = await prisma.appointment.findFirst({ where: { id, projectId } });
    if (!existing) {
      return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
    }

    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
