import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { TASK_STATUSES, PRIORITIES } from "@/lib/constants";
import { Plus, CheckSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TachesPage() {
  const projectId = await getCurrentProjectId();

  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  const columns = TASK_STATUSES.map((status) => ({
    ...status,
    tasks: tasks.filter((t) => t.status === status.value),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tâches"
        description="Gestion des tâches du chantier"
        action={
          <Link href="/taches/nouveau">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {columns.map((column) => (
          <div key={column.value} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={column.color}>{column.label}</Badge>
              <span className="text-sm text-muted-foreground">
                ({column.tasks.length})
              </span>
            </div>

            {column.tasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <CheckSquare className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucune tâche
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {column.tasks.map((task) => {
                  const priority = PRIORITIES.find(
                    (p) => p.value === task.priority
                  );

                  return (
                    <Link key={task.id} href={`/taches/${task.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-3">
                          <h4 className="font-medium text-sm truncate mb-2">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {priority && (
                              <Badge
                                variant="secondary"
                                className={`text-xs ${priority.color}`}
                              >
                                {priority.label}
                              </Badge>
                            )}
                          </div>
                          {task.assignedTo && (
                            <p className="text-xs text-muted-foreground">
                              {task.assignedTo}
                            </p>
                          )}
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Échéance : {formatDate(task.dueDate)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
