import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { REQUEST_TYPES, REQUEST_STATUSES } from "@/lib/constants";
import {
  Plus,
  MessageSquare,
  Calendar,
  User,
  FileQuestion,
} from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { value: "all", label: "Toutes" },
  ...REQUEST_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

export default async function DemandesPage() {
  const projectId = await getCurrentProjectId();

  const requests = await prisma.request.findMany({
    where: { projectId },
    include: {
      _count: {
        select: { comments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeTab = "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes & Decisions"
        description="Gerez les demandes, decisions et approbations du projet"
        action={
          <Link href="/demandes/nouveau">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle demande
            </Button>
          </Link>
        }
      />

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={
              tab.value === "all"
                ? "/demandes"
                : `/demandes?status=${tab.value}`
            }
          >
            <Button
              variant={activeTab === tab.value ? "default" : "outline"}
              size="sm"
            >
              {tab.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Request list */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Aucune demande
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Commencez par creer une nouvelle demande.
            </p>
            <Link href="/demandes/nouveau" className="mt-4">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Creer une demande
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => {
            const statusInfo = REQUEST_STATUSES.find(
              (s) => s.value === req.status
            );
            const typeInfo = REQUEST_TYPES.find((t) => t.value === req.type);

            return (
              <Link key={req.id} href={`/demandes/${req.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{req.title}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {typeInfo && (
                            <Badge variant="outline" className="text-xs">
                              {typeInfo.label}
                            </Badge>
                          )}
                          {statusInfo && (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {req.author}
                          </span>
                          {req.assignedTo && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Assignee: {req.assignedTo}
                            </span>
                          )}
                          {req.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Echeance: {formatDate(req.dueDate)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {req._count.comments} commentaire
                            {req._count.comments !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {formatRelativeTime(req.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
