import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eventSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.title = { contains: search };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(events);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des événements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const author = await getAuthor();
    const body = await request.json();
    const parsed = eventSchema.parse(body);

    const event = await prisma.event.create({
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        category: parsed.category,
        date: parsed.date ? new Date(parsed.date) : new Date(),
        priority: parsed.priority,
        author,
      },
    });

    await logActivity({
      type: "creation",
      description: `a créé l'événement "${event.title}"`,
      author,
      entityType: "event",
      entityId: event.id,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de l'événement" },
      { status: 400 }
    );
  }
}
