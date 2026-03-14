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
import { ListFilters } from "@/components/list-filters";
import { ExportCsvButton } from "@/components/export-csv-button";

export const dynamic = "force-dynamic";

interface DemandesPageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function DemandesPage({ searchParams }: DemandesPageProps) {
  const params = await searchParams;
  const projectId = await getCurrentProjectId();
  const statusFilter = params.status ?? "";
  const search = params.q?.trim().toLowerCase() ?? "";

  const requests = await prisma.request.findMany({
    where: {
      projectId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: {
      _count: {
        select: { comments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = search
    ? requests.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          (r.description ?? "").toLowerCase().includes(search) ||
          r.author.toLowerCase().includes(search) ||
          (r.assignedTo ?? "").toLowerCase().includes(search)
      )
    : requests;

  // Status counts for tabs
  const allRequests = await prisma.request.findMany({
    where: { projectId },
    select: { status: true },
  });
  const statusTabs = REQUEST_STATUSES.map((s) => ({
    value: s.value,
    label: s.label,
    color: s.color,
    count: allRequests.filter((r) => r.status === s.value).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes & Décisions"
        description="Gérez les demandes, décisions et approbations du projet"
        action={
          <Link href="/demandes/nouveau">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle demande
            </Button>
          </Link>
        }
      />

      <ListFilters
        searchPlaceholder="Rechercher une demande…"
        tabs={statusTabs}
        tabParam="status"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {search || statusFilter ? "Aucun résultat" : "Aucune demande"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || statusFilter
                ? "Essayez de modifier vos filtres."
                : "Commencez par créer une nouvelle demande."}
            </p>
            {!search && !statusFilter && (
              <Link href="/demandes/nouveau" className="mt-4">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Créer une demande
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} demande{filtered.length > 1 ? "s" : ""}
            </p>
            <ExportCsvButton
              filename={`demandes-${new Date().toISOString().split("T")[0]}`}
              columns={[
                { key: "title", label: "Titre" },
                { key: "type", label: "Type" },
                { key: "status", label: "Statut" },
                { key: "author", label: "Auteur" },
                { key: "assignedTo", label: "Assignée à" },
                { key: "dueDate", label: "Échéance" },
                { key: "createdAt", label: "Créée le" },
              ]}
              data={filtered.map((r) => ({
                title: r.title,
                type: REQUEST_TYPES.find((t) => t.value === r.type)?.label ?? r.type,
                status: REQUEST_STATUSES.find((s) => s.value === r.status)?.label ?? r.status,
                author: r.author,
                assignedTo: r.assignedTo ?? "",
                dueDate: r.dueDate ? formatDate(r.dueDate) : "",
                createdAt: formatDate(r.createdAt),
              }))}
            />
          </div>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 350px), 1fr))",
            }}
          >
            {filtered.map((req) => {
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
                            <h3 className="font-medium truncate">
                              {req.title}
                            </h3>
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
                                Assigné: {req.assignedTo}
                              </span>
                            )}
                            {req.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Échéance: {formatDate(req.dueDate)}
                              </span>
                            )}
                            {req._count.comments > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {req._count.comments} commentaire
                                {req._count.comments !== 1 ? "s" : ""}
                              </span>
                            )}
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
        </>
      )}
    </div>
  );
}
