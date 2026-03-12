import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate } from "@/lib/format";
import {
  CONSTRAINT_TYPES,
  CONSTRAINT_STATUSES,
  PENALTY_UNITS,
} from "@/lib/constants";
import { Plus, Shield, Calendar, User, Euro } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContraintesPage() {
  const projectId = await getCurrentProjectId();

  const constraints = await prisma.constraint.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contraintes & Penalites"
        description="Clauses contractuelles et penalites du projet"
        action={
          <Link href="/contraintes/nouveau">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle contrainte
            </Button>
          </Link>
        }
      />

      {constraints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Aucune contrainte
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Commencez par ajouter une contrainte contractuelle.
            </p>
            <Link href="/contraintes/nouveau" className="mt-4">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter une contrainte
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {constraints.map((constraint) => {
            const typeInfo = CONSTRAINT_TYPES.find(
              (t) => t.value === constraint.type
            );
            const statusInfo = CONSTRAINT_STATUSES.find(
              (s) => s.value === constraint.status
            );
            const unitInfo = PENALTY_UNITS.find(
              (u) => u.value === constraint.penaltyUnit
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
                          {constraint.penaltyAmount && (
                            <span className="flex items-center gap-1 text-orange-600 font-medium">
                              <Euro className="h-3 w-3" />
                              {constraint.penaltyAmount.toString()}&euro;{" "}
                              {unitInfo?.label}
                            </span>
                          )}
                          {constraint.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Echeance: {formatDate(constraint.dueDate)}
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
