import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { MEETING_REPORT_STATUSES } from "@/lib/constants";
import {
  Plus,
  ClipboardList,
  Calendar,
  MapPin,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ComptesRendusPage() {
  const projectId = await getCurrentProjectId();

  const reports = await prisma.meetingReport.findMany({
    where: { projectId },
    orderBy: { number: "desc" },
    include: {
      observations: {
        select: { status: true },
      },
    },
  });

  const stats = {
    total: reports.length,
    brouillon: reports.filter((r) => r.status === "brouillon").length,
    valide: reports.filter((r) => r.status === "valide").length,
    diffuse: reports.filter((r) => r.status === "diffuse").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptes-rendus"
        description="Comptes-rendus de réunion de chantier"
        action={
          <Link href="/comptes-rendus/nouveau">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nouveau CR
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {stats.brouillon}
            </div>
            <div className="text-xs text-muted-foreground">Brouillons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.valide}
            </div>
            <div className="text-xs text-muted-foreground">Validés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.diffuse}
            </div>
            <div className="text-xs text-muted-foreground">Diffusés</div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucun compte-rendu</p>
            <Link href="/comptes-rendus/nouveau">
              <Button variant="outline" size="sm" className="mt-3">
                <Plus className="h-4 w-4 mr-1" />
                Créer le premier CR
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 350px), 1fr))",
          }}
        >
          {reports.map((report) => {
            const statusInfo = MEETING_REPORT_STATUSES.find(
              (s) => s.value === report.status
            );
            const openObs = report.observations.filter((o) =>
              ["en_cours", "retard", "urgent"].includes(o.status)
            ).length;
            const urgentObs = report.observations.filter(
              (o) => o.status === "retard" || o.status === "urgent"
            ).length;

            return (
              <Link key={report.id} href={`/comptes-rendus/${report.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          CR n°{report.number}
                        </span>
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

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(report.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {report.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{report.location}</span>
                        </div>
                      )}
                    </div>

                    {(openObs > 0 || report.observations.length > 0) && (
                      <div className="mt-3 flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">
                          {report.observations.length} observation
                          {report.observations.length !== 1 ? "s" : ""}
                        </span>
                        {openObs > 0 && (
                          <span className="text-blue-600 font-medium">
                            {openObs} en cours
                          </span>
                        )}
                        {urgentObs > 0 && (
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <AlertCircle className="h-3 w-3" />
                            {urgentObs} en retard
                          </span>
                        )}
                      </div>
                    )}
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
