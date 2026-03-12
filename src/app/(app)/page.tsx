import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { formatRelativeTime } from "@/lib/format";
import { PRIORITIES, TASK_STATUSES, CONSTRAINT_STATUSES } from "@/lib/constants";
import {
  BookOpen,
  FileQuestion,
  FolderOpen,
  CheckSquare,
  Shield,
  Plus,
  CalendarClock,
  CalendarRange,
  Activity,
  AlertTriangle,
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
    totalConstraints,
    activeConstraints,
    violatedConstraints,
    recentEvents,
    recentActivities,
    upcomingTasks,
    urgentConstraints,
    upcomingDeadlines,
  ] = await Promise.all([
    prisma.event.count({ where: { projectId } }),
    prisma.request.count({ where: { projectId } }),
    prisma.request.count({ where: { projectId, status: "en_attente" } }),
    prisma.task.count({ where: { projectId } }),
    prisma.task.count({ where: { projectId, status: { not: "termine" } } }),
    prisma.document.count({ where: { projectId } }),
    prisma.constraint.count({ where: { projectId } }),
    prisma.constraint.count({ where: { projectId, status: "active" } }),
    prisma.constraint.count({ where: { projectId, status: "non_respectee" } }),
    prisma.event.findMany({ where: { projectId }, orderBy: { date: "desc" }, take: 5 }),
    prisma.activity.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.task.findMany({
      where: { projectId, status: { not: "termine" } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.constraint.findMany({
      where: { projectId, status: { in: ["active", "non_respectee"] } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    // Upcoming deadlines: tasks + constraints with dueDate in the future
    prisma.task.findMany({
      where: {
        projectId,
        status: { not: "termine" },
        dueDate: { not: null },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: { id: true, title: true, dueDate: true, status: true, assignedTo: true },
    }),
  ]);

  // Also fetch constraint deadlines for the planning section
  const constraintDeadlines = await prisma.constraint.findMany({
    where: {
      projectId,
      status: "active",
      dueDate: { not: null },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
    select: { id: true, title: true, dueDate: true, penaltyAmount: true, penaltyUnit: true },
  });

  // Merge and sort deadlines
  const now = new Date();
  type DeadlineItem = {
    id: string;
    title: string;
    dueDate: Date;
    type: "task" | "constraint";
    isOverdue: boolean;
    detail?: string;
  };

  const allDeadlines: DeadlineItem[] = [
    ...upcomingDeadlines.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate!,
      type: "task" as const,
      isOverdue: t.dueDate! < now,
      detail: t.assignedTo || undefined,
    })),
    ...constraintDeadlines.map((c) => ({
      id: c.id,
      title: c.title,
      dueDate: c.dueDate!,
      type: "constraint" as const,
      isOverdue: c.dueDate! < now,
      detail: c.penaltyAmount ? `${c.penaltyAmount}€` : undefined,
    })),
  ].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, 6);

  const stats = [
    { label: "Événements", value: totalEvents, icon: BookOpen, href: "/journal", color: "text-blue-600" },
    { label: "Demandes", value: `${pendingRequests} en attente / ${totalRequests}`, icon: FileQuestion, href: "/demandes", color: "text-orange-600" },
    { label: "Tâches actives", value: `${activeTasks} / ${totalTasks}`, icon: CheckSquare, href: "/taches", color: "text-green-600" },
    { label: "Documents", value: totalDocuments, icon: FolderOpen, href: "/documents", color: "text-purple-600" },
    {
      label: "Contraintes",
      value: violatedConstraints > 0
        ? `${violatedConstraints} violée${violatedConstraints > 1 ? "s" : ""} / ${totalConstraints}`
        : `${activeConstraints} active${activeConstraints > 1 ? "s" : ""} / ${totalConstraints}`,
      icon: Shield,
      href: "/contraintes",
      color: violatedConstraints > 0 ? "text-red-600" : "text-indigo-600",
    },
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
        <Link href="/contraintes/nouveau">
          <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Contrainte</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

      {/* Alerts: Violated Constraints */}
      {violatedConstraints > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                {violatedConstraints} contrainte{violatedConstraints > 1 ? "s" : ""} violée{violatedConstraints > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-red-600">Des pénalités financières peuvent s&apos;appliquer</p>
            </div>
            <Link href="/contraintes">
              <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                Voir les contraintes
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines / Planning */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              Prochaines échéances
            </CardTitle>
            <Link href="/planning"><Button variant="ghost" size="sm">Voir le planning</Button></Link>
          </CardHeader>
          <CardContent>
            {allDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune échéance à venir</p>
            ) : (
              <div className="space-y-3">
                {allDeadlines.map((item) => {
                  const daysUntil = Math.ceil((item.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const dateColor = item.isOverdue
                    ? "text-red-600 bg-red-50"
                    : daysUntil <= 7
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-600 bg-gray-50";

                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.type === "task" ? `/taches/${item.id}` : `/contraintes/${item.id}`}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                    >
                      <div className={`text-xs font-medium px-2 py-1 rounded ${dateColor} shrink-0 w-20 text-center`}>
                        {item.isOverdue
                          ? `${Math.abs(daysUntil)}j retard`
                          : daysUntil === 0
                          ? "Aujourd'hui"
                          : `${daysUntil}j`}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.type === "task" ? "Tâche" : "Contrainte"}
                          {item.detail ? ` · ${item.detail}` : ""}
                        </p>
                      </div>
                      {item.type === "constraint" ? (
                        <Shield className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      ) : (
                        <CheckSquare className="h-3.5 w-3.5 text-green-400 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Constraints Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Contraintes
            </CardTitle>
            <Link href="/contraintes"><Button variant="ghost" size="sm">Voir tout</Button></Link>
          </CardHeader>
          <CardContent>
            {urgentConstraints.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune contrainte active</p>
            ) : (
              <div className="space-y-3">
                {urgentConstraints.map((constraint) => {
                  const statusInfo = CONSTRAINT_STATUSES.find((s) => s.value === constraint.status);
                  return (
                    <Link key={constraint.id} href={`/contraintes/${constraint.id}`} className="flex items-start justify-between gap-2 p-2 rounded hover:bg-gray-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{constraint.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {constraint.responsible || constraint.author}
                          {constraint.penaltyAmount ? (
                            <span className="text-orange-600 font-medium"> · {constraint.penaltyAmount}€</span>
                          ) : null}
                        </p>
                      </div>
                      {statusInfo && (
                        <Badge variant="secondary" className={`text-xs shrink-0 ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

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
