import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime } from "@/lib/format";
import { TASK_STATUSES, PRIORITIES } from "@/lib/constants";
import { TaskStatusChanger } from "./task-status-changer";
import { DeleteTaskButton } from "./delete-task-button";

export const dynamic = "force-dynamic";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const projectId = await getCurrentProjectId();

  const task = await prisma.task.findFirst({
    where: { id, projectId },
  });

  if (!task) {
    notFound();
  }

  const statusInfo = TASK_STATUSES.find((s) => s.value === task.status);
  const priorityInfo = PRIORITIES.find((p) => p.value === task.priority);

  return (
    <div className="space-y-6">
      <PageHeader title={task.title} />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Description
              </h2>
              {task.description ? (
                <p className="text-sm whitespace-pre-wrap">
                  {task.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Aucune description
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Changer le statut
              </h2>
              <TaskStatusChanger taskId={task.id} currentStatus={task.status} task={{
                title: task.title,
                description: task.description ?? undefined,
                priority: task.priority,
                assignedTo: task.assignedTo ?? undefined,
                dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : undefined,
              }} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Détails
              </h2>

              <div>
                <p className="text-xs text-muted-foreground">Statut</p>
                {statusInfo && (
                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground">Priorité</p>
                {priorityInfo && (
                  <Badge variant="secondary" className={priorityInfo.color}>
                    {priorityInfo.label}
                  </Badge>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground">Assignée à</p>
                <p className="text-sm font-medium">
                  {task.assignedTo || "Non assignée"}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground">
                  Date d&apos;échéance
                </p>
                <p className="text-sm font-medium">
                  {task.dueDate ? formatDate(task.dueDate) : "Non définie"}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground">Créée par</p>
                <p className="text-sm font-medium">{task.author}</p>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground">Créée le</p>
                <p className="text-sm font-medium">
                  {formatDateTime(task.createdAt)}
                </p>
              </div>

              <Separator />

              <DeleteTaskButton id={task.id} name={task.title} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
