import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalEvents,
      totalRequests,
      pendingRequests,
      totalTasks,
      activeTasks,
      totalDocuments,
      recentEvents,
      recentActivities,
      upcomingTasks,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.request.count(),
      prisma.request.count({ where: { status: "en_attente" } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: { not: "termine" } } }),
      prisma.document.count(),
      prisma.event.findMany({ orderBy: { date: "desc" }, take: 5 }),
      prisma.activity.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.task.findMany({
        where: { status: { not: "termine" }, dueDate: { not: null } },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      stats: { totalEvents, totalRequests, pendingRequests, totalTasks, activeTasks, totalDocuments },
      recentEvents,
      recentActivities,
      upcomingTasks,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
