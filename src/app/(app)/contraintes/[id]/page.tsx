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
  CONSTRAINT_CATEGORIES,
  CONSTRAINT_STATUSES,
  PENALTY_PER,
  PENALTY_CAP_UNITS,
} from "@/lib/constants";
import { ArrowLeft, Calendar, User, Clock, Euro, FileText, Scale, AlertTriangle, Pencil } from "lucide-react";
import { CommentsSection } from "@/components/comments-section";
import { StatusChanger } from "./status-changer";
import { DeleteButton } from "./delete-button";
import { PenaltyCalculator } from "./penalty-calculator";

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

  const categoryInfo = CONSTRAINT_CATEGORIES.find(
    (c) => c.value === (constraint.category || constraint.type)
  );
  const statusInfo = CONSTRAINT_STATUSES.find(
    (s) => s.value === constraint.status
  );
  const penaltyPerInfo = PENALTY_PER.find(
    (p) => p.value === (constraint.penaltyPer || constraint.penaltyUnit)
  );
  const capUnitInfo = PENALTY_CAP_UNITS.find(
    (u) => u.value === constraint.penaltyCapUnit
  );

  const hasPenalty = constraint.penaltyAmount || constraint.penaltyPer ||
    constraint.penaltyFormula || constraint.penaltyCap ||
    constraint.escalation || constraint.condition || constraint.penaltyDetails;

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
                    {categoryInfo && (
                      <Badge variant="outline">{categoryInfo.label}</Badge>
                    )}
                    {statusInfo && (
                      <Badge
                        variant="secondary"
                        className={statusInfo.color}
                      >
                        {statusInfo.label}
                      </Badge>
                    )}
                    {constraint.articleRef && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {constraint.articleRef}
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

              {constraint.sourceDocument && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Source :</span>
                  <span className="font-medium">{constraint.sourceDocument}</span>
                </div>
              )}

              {(constraint.description || constraint.sourceDocument) && hasPenalty && (
                <Separator />
              )}

              {/* Penalty section */}
              {hasPenalty && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1">
                      <Euro className="h-4 w-4" />
                      Pénalité
                    </h3>
                    <div className="space-y-3">
                      {/* Amount and mode */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {constraint.penaltyAmount && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Montant :</span>{" "}
                            <span className="font-semibold text-orange-600">
                              {constraint.penaltyAmount.toLocaleString("fr-FR")} €
                            </span>
                            {penaltyPerInfo && (
                              <span className="text-muted-foreground ml-1">
                                {penaltyPerInfo.label.toLowerCase()}
                              </span>
                            )}
                          </div>
                        )}
                        {!constraint.penaltyAmount && penaltyPerInfo && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Mode :</span>{" "}
                            <span className="font-medium">{penaltyPerInfo.label}</span>
                          </div>
                        )}
                        {constraint.penaltyCap && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Plafond :</span>{" "}
                            <span className="font-medium">
                              {capUnitInfo?.value === "pourcentage_contrat"
                                ? `${constraint.penaltyCap}% du montant HT`
                                : `${constraint.penaltyCap.toLocaleString("fr-FR")} €`}
                              {capUnitInfo?.value === "par_unite" && " par unité"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Formula */}
                      {constraint.penaltyFormula && (
                        <div className="text-sm bg-orange-50 border border-orange-200 rounded-md p-3">
                          <span className="text-muted-foreground flex items-center gap-1 mb-1">
                            <Scale className="h-3.5 w-3.5" />
                            Formule :
                          </span>
                          <p className="font-medium">{constraint.penaltyFormula}</p>
                        </div>
                      )}

                      {/* Condition */}
                      {constraint.condition && (
                        <div className="text-sm">
                          <span className="text-muted-foreground flex items-center gap-1 mb-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Condition de déclenchement :
                          </span>
                          <p className="whitespace-pre-wrap">{constraint.condition}</p>
                        </div>
                      )}

                      {/* Escalation */}
                      {constraint.escalation && (
                        <div className="text-sm bg-red-50 border border-red-200 rounded-md p-3">
                          <span className="text-muted-foreground mb-1 block">Escalade / Récidive :</span>
                          <p className="whitespace-pre-wrap font-medium">{constraint.escalation}</p>
                        </div>
                      )}

                      {/* Details */}
                      {constraint.penaltyDetails && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Détails :</span>
                          <p className="mt-1 whitespace-pre-wrap">{constraint.penaltyDetails}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {constraint.responsible && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Responsable :</span>
                    <span className="font-medium">
                      {constraint.responsible}
                    </span>
                  </div>
                )}

                {constraint.dueDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Échéance :</span>
                    <span className="font-medium">
                      {formatDate(constraint.dueDate)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Créé le :</span>
                  <span className="font-medium">
                    {formatDateTime(constraint.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Mis à jour :</span>
                  <span className="font-medium">
                    {formatDateTime(constraint.updatedAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <CommentsSection entityType="constraint" entityId={constraint.id} />
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

          <PenaltyCalculator
            constraintId={constraint.id}
            penaltyAmount={constraint.penaltyAmount}
            penaltyPer={constraint.penaltyPer || constraint.penaltyUnit}
            penaltyCap={constraint.penaltyCap}
            penaltyCapUnit={constraint.penaltyCapUnit}
            occurrences={constraint.occurrences ?? 0}
            dueDate={constraint.dueDate?.toISOString() ?? null}
            penaltyStartDate={constraint.penaltyStartDate?.toISOString() ?? null}
            resolvedDate={constraint.resolvedDate?.toISOString() ?? null}
          />

          {constraint.recurrenceType && constraint.recurrenceType !== "ponctuelle" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Récurrence
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fréquence</span>
                  <span className="font-medium capitalize">{constraint.recurrenceType}</span>
                </div>
                {constraint.recurrenceDay && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jour</span>
                    <span className="font-medium">{constraint.recurrenceDay}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé</CardTitle>
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
                <span className="text-muted-foreground">Catégorie</span>
                <span className="font-medium text-right">{categoryInfo?.label || "-"}</span>
              </div>
              {constraint.articleRef && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Article</span>
                  <span className="font-mono text-xs">{constraint.articleRef}</span>
                </div>
              )}
              {constraint.penaltyAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pénalité</span>
                  <span className="font-medium text-orange-600">
                    {constraint.penaltyAmount.toLocaleString("fr-FR")} €
                  </span>
                </div>
              )}
              {constraint.penaltyCap && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plafond</span>
                  <span className="font-medium">
                    {capUnitInfo?.value === "pourcentage_contrat"
                      ? `${constraint.penaltyCap}%`
                      : `${constraint.penaltyCap.toLocaleString("fr-FR")} €`}
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
