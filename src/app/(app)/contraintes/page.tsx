import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate } from "@/lib/format";
import {
  CONSTRAINT_CATEGORIES,
  CONSTRAINT_STATUSES,
  PENALTY_PER,
} from "@/lib/constants";
import { Plus, Shield, Calendar, User, Euro, MessageSquare } from "lucide-react";
import { ListFilters } from "@/components/list-filters";

export const dynamic = "force-dynamic";

interface ContraintesPageProps {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
}

export default async function ContraintesPage({ searchParams }: ContraintesPageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? "";
  const categoryFilter = params.category ?? "";
  const search = params.q?.trim().toLowerCase() ?? "";
  const projectId = await getCurrentProjectId();

  const where: Record<string, unknown> = { projectId };
  if (statusFilter) where.status = statusFilter;
  if (categoryFilter) where.category = categoryFilter;

  const [constraintsRaw, allConstraints] = await Promise.all([
    prisma.constraint.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    // For stats, get all constraints (unfiltered)
    prisma.constraint.findMany({
      where: { projectId },
      select: { status: true, penaltyAmount: true },
    }),
  ]);

  const constraints = search
    ? constraintsRaw.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          (c.description ?? "").toLowerCase().includes(search) ||
          (c.responsible ?? "").toLowerCase().includes(search) ||
          (c.articleRef ?? "").toLowerCase().includes(search)
      )
    : constraintsRaw;

  const constraintIds = constraints.map((c) => c.id);
  const commentCounts = constraintIds.length > 0
    ? await prisma.comment.groupBy({
        by: ["entityId"],
        where: { entityType: "constraint", entityId: { in: constraintIds } },
        _count: true,
      })
    : [];
  const commentCountMap = new Map(
    commentCounts.map((c) => [c.entityId, c._count])
  );

  // Stats
  const stats = {
    total: allConstraints.length,
    active: allConstraints.filter((c) => c.status === "active").length,
    respectee: allConstraints.filter((c) => c.status === "respectee").length,
    non_respectee: allConstraints.filter((c) => c.status === "non_respectee").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suivi Contractuel & Réglementaire"
        description="Clauses contractuelles, pénalités et obligations du projet"
        action={
          <Link href="/contraintes/nouveau">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Nouveau point de suivi
            </Button>
          </Link>
        }
      />

      <ListFilters
        searchPlaceholder="Rechercher une contrainte…"
        tabs={[
          { value: "active", label: "Actives", count: stats.active, color: "bg-blue-50 text-blue-700" },
          { value: "respectee", label: "Respectées", count: stats.respectee, color: "bg-green-50 text-green-700" },
          { value: "non_respectee", label: "Non respectées", count: stats.non_respectee, color: "bg-red-50 text-red-700" },
        ]}
        tabParam="status"
      />

      {constraints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {statusFilter || categoryFilter
                ? "Aucun résultat pour ce filtre"
                : "Aucun point de suivi"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter || categoryFilter
                ? "Essayez de modifier les filtres."
                : "Commencez par ajouter une clause contractuelle ou obligation."}
            </p>
            {!statusFilter && !categoryFilter && (
              <Link href="/contraintes/nouveau" className="mt-4">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un point de suivi
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 350px), 1fr))" }}>
          {constraints.map((constraint) => {
            const categoryInfo = CONSTRAINT_CATEGORIES.find(
              (c) => c.value === (constraint.category || constraint.type)
            );
            const statusInfo = CONSTRAINT_STATUSES.find(
              (s) => s.value === constraint.status
            );
            const penaltyPerInfo = PENALTY_PER.find(
              (p) => p.value === (constraint.penaltyPer || constraint.penaltyUnit)
            );

            return (
              <Link key={constraint.id} href={`/contraintes/${constraint.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">
                            {constraint.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {categoryInfo && (
                            <Badge variant="outline" className="text-xs">
                              {categoryInfo.label}
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
                          {constraint.articleRef && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {constraint.articleRef}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                          {constraint.penaltyAmount && (
                            <span className="flex items-center gap-1 text-orange-600 font-medium">
                              <Euro className="h-3 w-3" />
                              {constraint.penaltyAmount.toLocaleString("fr-FR")} €
                              {penaltyPerInfo && (
                                <span className="font-normal text-muted-foreground ml-0.5">
                                  {penaltyPerInfo.label.toLowerCase()}
                                </span>
                              )}
                            </span>
                          )}
                          {constraint.penaltyCap && (
                            <span className="text-muted-foreground">
                              Plafond: {constraint.penaltyCap.toLocaleString("fr-FR")} €
                            </span>
                          )}
                          {constraint.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(constraint.dueDate)}
                            </span>
                          )}
                          {constraint.responsible && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {constraint.responsible}
                            </span>
                          )}
                          {(commentCountMap.get(constraint.id) ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {commentCountMap.get(constraint.id)}
                            </span>
                          )}
                        </div>
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
