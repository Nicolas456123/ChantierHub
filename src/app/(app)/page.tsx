import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { formatRelativeTime } from "@/lib/format";
import { PRIORITIES, REQUEST_STATUSES, TASK_STATUSES } from "@/lib/constants";
import {
  BookOpen,
  FileQuestion,
  FolderOpen,
  CheckSquare,
  Plus,
  CalendarClock,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
    prisma.request.count({ where: { projectId, status: "en_attente" } }),
    prisma.task.count({ where: { projectId } }),
    prisma.task.count({ where: { projectId, status: { not: "termine" } } }),
    prisma.document.count({ where: { projectId } }),
    prisma.event.findMany({ where: { projectId }, orderBy: { date: "desc" }, take: 5 }),
    prisma.activity.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.task.findMany({
      where: { projectId, status: { not: "termine" } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Événements", value: totalEvents, icon: BookOpen, href: "/journal", color: "text-blue-600" },
    { label: "Demandes", value: `${pendingRequests} en attente / ${totalRequests}`, icon: FileQuestion, href: "/demandes", color: "text-orange-600" },
    { label: "Tâches actives", value: `${activeTasks} / ${totalTasks}`, icon: CheckSquare, href: "/taches", color: "text-green-600" },
    { label: "Documents", value: totalDocuments, icon: FolderOpen, href: "/documents", color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" description="Vue d'ensemble du projet" />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/journal/nouveau">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Événement</Button>
        </Link>
        <Link href="/demandes/nouveau">
          <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Demande</Button>
        </Link>
        <Link href="/taches/nouveau">
          <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Tâche</Button>
        </Link>
        <Link href="/documents/nouveau">
          <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Document</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Derniers événements
            </CardTitle>
            <Link href="/journal"><Button variant="ghost" size="sm">Voir tout</Button></Link>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun événement</p>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => {
                  const priority = PRIORITIES.find((p) => p.value === event.priority);
                  return (
                    <Link key={event.id} href={`/journal/${event.id}`} className="flex items-start justify-between gap-2 p-2 rounded hover:bg-gray-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.author} - {formatRelativeTime(event.date)}</p>
                      </div>
                      {priority && priority.value !== "normale" && (
                        <Badge variant="secondary" className={`text-xs shrink-0 ${priority.color}`}>{priority.label}</Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tâches en cours
            </CardTitle>
            <Link href="/taches"><Button variant="ghost" size="sm">Voir tout</Button></Link>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune tâche active</p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const status = TASK_STATUSES.find((s) => s.value === task.status);
                  return (
                    <Link key={task.id} href={`/taches/${task.id}`} className="flex items-start justify-between gap-2 p-2 rounded hover:bg-gray-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.assignedTo || task.author}</p>
                      </div>
                      {status && (
                        <Badge variant="secondary" className={`text-xs shrink-0 ${status.color}`}>{status.label}</Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activité récente
            </CardTitle>
            <Link href="/historique"><Button variant="ghost" size="sm">Voir tout</Button></Link>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune activité</p>
            ) : (
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 text-sm p-2">
                    <div className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />
                    <span className="font-medium shrink-0">{activity.author}</span>
                    <span className="text-muted-foreground truncate">{activity.description}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-auto">{formatRelativeTime(activity.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
