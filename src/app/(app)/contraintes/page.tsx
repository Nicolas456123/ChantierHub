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
import { Plus, Shield, Calendar, User, Euro } from "lucide-react";

export const dynamic = "force-dynamic";

interface ContraintesPageProps {
  searchParams: Promise<{ status?: string; category?: string }>;
}

export default async function ContraintesPage({ searchParams }: ContraintesPageProps) {
  const { status: statusFilter, category: categoryFilter } = await searchParams;
  const projectId = await getCurrentProjectId();

  const where: Record<string, unknown> = { projectId };
  if (statusFilter) where.status = statusFilter;
  if (categoryFilter) where.category = categoryFilter;

  const [constraints, allConstraints] = await Promise.all([
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

  // Stats
  const stats = {
    total: allConstraints.length,
    active: allConstraints.filter((c) => c.status === "active").length,
    respectee: allConstraints.filter((c) => c.status === "respectee").length,
    violee: allConstraints.filter((c) => c.status === "violee").length,
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

      {/* Stats bar */}
      {stats.total > 0 && (
        <div className="flex flex-wrap gap-3">
          <Link href="/contraintes">
            <Badge
              variant={!statusFilter && !categoryFilter ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
            >
              Tous ({stats.total})
            </Badge>
          </Link>
          <Link href="/contraintes?status=active">
            <Badge
              variant={statusFilter === "active" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              Actives ({stats.active})
            </Badge>
          </Link>
          <Link href="/contraintes?status=respectee">
            <Badge
              variant={statusFilter === "respectee" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            >
              Respectées ({stats.respectee})
            </Badge>
          </Link>
          <Link href="/contraintes?status=violee">
            <Badge
              variant={statusFilter === "violee" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            >
              Violées ({stats.violee})
            </Badge>
          </Link>
        </div>
      )}

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
        <div className="grid gap-4">
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
