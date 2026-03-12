import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  CONSTRAINT_TYPES,
  CONSTRAINT_STATUSES,
  PENALTY_UNITS,
} from "@/lib/constants";
import { ArrowLeft, Calendar, User, Clock, Euro, Pencil } from "lucide-react";
import { StatusChanger } from "./status-changer";
import { DeleteButton } from "./delete-button";

export const dynamic = "force-dynamic";

interface ContrainteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContrainteDetailPage({
  params,
}: ContrainteDetailPageProps) {
  const { id } = await params;
  const projectId = await getCurrentProjectId();

  const constraint = await prisma.constraint.findFirst({
    where: { id, projectId },
  });

  if (!constraint) {
    notFound();
  }

  const typeInfo = CONSTRAINT_TYPES.find((t) => t.value === constraint.type);
  const statusInfo = CONSTRAINT_STATUSES.find(
    (s) => s.value === constraint.status
  );
  const unitInfo = PENALTY_UNITS.find(
    (u) => u.value === constraint.penaltyUnit
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/contraintes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-xl">
                    {constraint.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {typeInfo && (
                      <Badge variant="outline">{typeInfo.label}</Badge>
                    )}
                    {statusInfo && (
                      <Badge
                        variant="secondary"
                        className={statusInfo.color}
                      >
                        {statusInfo.label}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/contraintes/${constraint.id}/modifier`}>
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <DeleteButton
                    constraintId={constraint.id}
                    constraintTitle={constraint.title}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {constraint.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Description
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {constraint.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Penalty section */}
              {(constraint.penaltyAmount ||
                constraint.penaltyUnit ||
                constraint.penaltyDetails) && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Euro className="h-4 w-4" />
                      Penalites
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {constraint.penaltyAmount && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Montant:
                          </span>{" "}
                          <span className="font-medium text-orange-600">
                            {constraint.penaltyAmount.toString()}&euro;
                          </span>
                        </div>
                      )}
                      {unitInfo && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Unite:</span>{" "}
                          <span className="font-medium">{unitInfo.label}</span>
                        </div>
                      )}
                    </div>
                    {constraint.penaltyDetails && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Details:</span>
                        <p className="mt-1 whitespace-pre-wrap">
                          {constraint.penaltyDetails}
                        </p>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {constraint.responsible && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Responsable:</span>
                    <span className="font-medium">
                      {constraint.responsible}
                    </span>
                  </div>
                )}

                {constraint.dueDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Echeance:</span>
                    <span className="font-medium">
                      {formatDate(constraint.dueDate)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Creee le:</span>
                  <span className="font-medium">
                    {formatDateTime(constraint.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Mise a jour:</span>
                  <span className="font-medium">
                    {formatDateTime(constraint.updatedAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Changer le statut</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusChanger
                constraintId={constraint.id}
                currentStatus={constraint.status}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut</span>
                {statusInfo && (
                  <Badge
                    variant="secondary"
                    className={`text-xs ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </Badge>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{typeInfo?.label || "-"}</span>
              </div>
              {constraint.penaltyAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Penalite</span>
                  <span className="font-medium text-orange-600">
                    {constraint.penaltyAmount.toString()}&euro;
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
