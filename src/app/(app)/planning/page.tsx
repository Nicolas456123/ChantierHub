import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import {
  TASK_STATUSES,
  REQUEST_STATUSES,
  CONSTRAINT_STATUSES,
  PENALTY_PER,
} from "@/lib/constants";
import {
  CalendarRange,
  CheckSquare,
  FileQuestion,
  Shield,
  AlertTriangle,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

type TimelineItem = {
  id: string;
  title: string;
  type: "task" | "request" | "constraint";
  status: string;
  dueDate: Date;
  href: string;
  statusColor: string;
  penaltyAmount?: number | null;
  penaltyUnit?: string | null;
};

type TimelinePeriod = {
  label: string;
  dotColor: string;
  borderColor: string;
  items: TimelineItem[];
};

function getStatusColor(
  type: "task" | "request" | "constraint",
  status: string
): string {
  const lists = {
    task: TASK_STATUSES,
    request: REQUEST_STATUSES,
    constraint: CONSTRAINT_STATUSES,
  };
  const found = lists[type].find(
    (s: { value: string; color: string }) => s.value === status
  );
  return found?.color ?? "bg-gray-100 text-gray-800";
}

function getStatusLabel(
  type: "task" | "request" | "constraint",
  status: string
): string {
  const lists = {
    task: TASK_STATUSES,
    request: REQUEST_STATUSES,
    constraint: CONSTRAINT_STATUSES,
  };
  const found = lists[type].find(
    (s: { value: string; label: string }) => s.value === status
  );
  return found?.label ?? status;
}

function isCompleted(type: "task" | "request" | "constraint", status: string) {
  if (type === "task") return status === "termine";
  if (type === "request") return status === "valide";
  if (type === "constraint") return status === "respectee";
  return false;
}

function getTypeIcon(type: "task" | "request" | "constraint") {
  switch (type) {
    case "task":
      return <CheckSquare className="h-4 w-4" />;
    case "request":
      return <FileQuestion className="h-4 w-4" />;
    case "constraint":
      return <Shield className="h-4 w-4" />;
  }
}

function getTypeLabel(type: "task" | "request" | "constraint") {
  switch (type) {
    case "task":
      return "Tache";
    case "request":
      return "Demande";
    case "constraint":
      return "Contrainte";
  }
}

function getPenaltyUnitLabel(unit: string): string {
  const found = PENALTY_PER.find((u) => u.value === unit);
  return found?.label ?? unit;
}

function classifyItem(
  item: TimelineItem,
  now: Date,
  endOfWeek: Date,
  endOfMonth: Date
): "overdue" | "this_week" | "this_month" | "later" {
  if (isCompleted(item.type, item.status)) return "later";
  if (item.dueDate < now) return "overdue";
  if (item.dueDate <= endOfWeek) return "this_week";
  if (item.dueDate <= endOfMonth) return "this_month";
  return "later";
}

export default async function PlanningPage() {
  const projectId = await getCurrentProjectId();

  const [tasks, requests, constraints] = await Promise.all([
    prisma.task.findMany({
      where: { projectId, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.request.findMany({
      where: { projectId, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.constraint.findMany({
      where: { projectId, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const items: TimelineItem[] = [
    ...tasks.map((t) => ({
      id: t.id,
      title: t.title,
      type: "task" as const,
      status: t.status,
      dueDate: t.dueDate!,
      href: `/taches/${t.id}`,
      statusColor: getStatusColor("task", t.status),
    })),
    ...requests.map((r) => ({
      id: r.id,
      title: r.title,
      type: "request" as const,
      status: r.status,
      dueDate: r.dueDate!,
      href: `/demandes/${r.id}`,
      statusColor: getStatusColor("request", r.status),
    })),
    ...constraints.map((c) => ({
      id: c.id,
      title: c.title,
      type: "constraint" as const,
      status: c.status,
      dueDate: c.dueDate!,
      href: `/contraintes/${c.id}`,
      statusColor: getStatusColor("constraint", c.status),
      penaltyAmount: c.penaltyAmount,
      penaltyUnit: c.penaltyPer || c.penaltyUnit,
    })),
  ].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dayOfWeek = now.getDay();
  const daysUntilEndOfWeek = 7 - dayOfWeek;
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + daysUntilEndOfWeek);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const grouped: Record<string, TimelineItem[]> = {
    overdue: [],
    this_week: [],
    this_month: [],
    later: [],
  };

  for (const item of items) {
    const period = classifyItem(item, startOfToday, endOfWeek, endOfMonth);
    grouped[period].push(item);
  }

  const periods: TimelinePeriod[] = [
    {
      label: "En retard",
      dotColor: "bg-red-500",
      borderColor: "border-l-red-500",
      items: grouped.overdue,
    },
    {
      label: "Cette semaine",
      dotColor: "bg-orange-500",
      borderColor: "border-l-orange-500",
      items: grouped.this_week,
    },
    {
      label: "Ce mois",
      dotColor: "bg-blue-500",
      borderColor: "border-l-blue-500",
      items: grouped.this_month,
    },
    {
      label: "Plus tard",
      dotColor: "bg-gray-400",
      borderColor: "border-l-gray-400",
      items: grouped.later,
    },
  ];

  const overdueCount = grouped.overdue.length;
  const thisWeekCount = grouped.this_week.length;
  const thisMonthCount = grouped.this_month.length;
  const totalCount = items.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning"
        description="Echeances et timeline du projet"
      />

      {totalCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarRange className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">Aucune echeance</h3>
            <p className="text-sm text-muted-foreground">
              Ajoutez des dates d&apos;echeance a vos taches, demandes ou
              contraintes pour les voir ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{overdueCount}</p>
                  <p className="text-xs text-muted-foreground">En retard</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-orange-500 shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{thisWeekCount}</p>
                  <p className="text-xs text-muted-foreground">Cette semaine</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{thisMonthCount}</p>
                  <p className="text-xs text-muted-foreground">Ce mois</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CalendarRange className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{totalCount}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <div className="space-y-8">
            {periods.map((period) => {
              if (period.items.length === 0) return null;

              return (
                <div key={period.label}>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`h-3 w-3 rounded-full ${period.dotColor}`}
                    />
                    <h2 className="text-lg font-semibold">{period.label}</h2>
                    <span className="text-sm text-muted-foreground">
                      ({period.items.length})
                    </span>
                  </div>

                  <div className="relative ml-1.5">
                    {/* Vertical line */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-0.5 ${period.dotColor}`}
                    />

                    <div className="space-y-4">
                      {period.items.map((item) => {
                        const completed = isCompleted(item.type, item.status);

                        return (
                          <div key={`${item.type}-${item.id}`} className="flex gap-4 relative">
                            {/* Dot on the line */}
                            <div className="relative flex items-start">
                              <div
                                className={`absolute -left-1.5 top-4 h-3 w-3 rounded-full border-2 border-white ${
                                  completed ? "bg-green-500" : period.dotColor
                                }`}
                              />
                            </div>

                            {/* Date column */}
                            <div className="w-24 shrink-0 pt-3 pl-4">
                              <p className="text-sm font-medium text-muted-foreground">
                                {formatDate(item.dueDate)}
                              </p>
                            </div>

                            {/* Card */}
                            <Link href={item.href} className="flex-1 min-w-0">
                              <Card
                                className={`border-l-4 ${
                                  completed
                                    ? "border-l-green-500"
                                    : period.borderColor
                                } hover:shadow-md transition-shadow cursor-pointer`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-muted-foreground">
                                          {getTypeIcon(item.type)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {getTypeLabel(item.type)}
                                        </span>
                                      </div>
                                      <h3 className="font-medium truncate">
                                        {item.title}
                                      </h3>
                                    </div>
                                    <Badge
                                      className={`shrink-0 ${
                                        completed
                                          ? "bg-green-100 text-green-800"
                                          : item.statusColor
                                      }`}
                                    >
                                      {completed && (
                                        <CheckSquare className="h-3 w-3 mr-1" />
                                      )}
                                      {getStatusLabel(item.type, item.status)}
                                    </Badge>
                                  </div>

                                  {item.penaltyAmount != null &&
                                    item.penaltyAmount > 0 && (
                                      <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>
                                          Penalite : {item.penaltyAmount.toLocaleString("fr-FR")}{" "}
                                          EUR
                                          {item.penaltyUnit &&
                                            ` - ${getPenaltyUnitLabel(item.penaltyUnit)}`}
                                        </span>
                                      </div>
                                    )}

                                  {period.label !== "En retard" && !completed && (() => {
                                    const daysRemaining = Math.ceil(
                                      (item.dueDate.getTime() - startOfToday.getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    );
                                    const colorClass =
                                      daysRemaining <= 3
                                        ? "text-orange-500"
                                        : daysRemaining <= 7
                                          ? "text-amber-500"
                                          : "text-muted-foreground";
                                    return (
                                      <div className={`flex items-center gap-1 mt-2 text-xs ${colorClass}`}>
                                        <Clock className="h-3 w-3" />
                                        <span>
                                          Dans {daysRemaining} jour(s)
                                        </span>
                                      </div>
                                    );
                                  })()}

                                  {period.label === "En retard" && !completed && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        En retard de{" "}
                                        {Math.ceil(
                                          (startOfToday.getTime() -
                                            item.dueDate.getTime()) /
                                            (1000 * 60 * 60 * 24)
                                        )}{" "}
                                        jour(s)
                                      </span>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
