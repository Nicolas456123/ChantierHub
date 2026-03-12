import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";

export async function GET() {
  try {
    const projectId = await getCurrentProjectId();
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
      prisma.event.count({ where: { projectId } }),
      prisma.request.count({ where: { projectId } }),
      prisma.request.count({ where: { status: "en_attente", projectId } }),
      prisma.task.count({ where: { projectId } }),
      prisma.task.count({ where: { status: { not: "termine" }, projectId } }),
      prisma.document.count({ where: { projectId } }),
      prisma.event.findMany({ where: { projectId }, orderBy: { date: "desc" }, take: 5 }),
      prisma.activity.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.task.findMany({
        where: { status: { not: "termine" }, dueDate: { not: null }, projectId },
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
