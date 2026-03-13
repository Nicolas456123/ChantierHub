"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface Activity {
  id: string;
  type: string;
  description: string;
  author: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
}

interface ActivitiesResponse {
  activities: Activity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ENTITY_TYPES = [
  { value: "", label: "Tous les types" },
  { value: "event", label: "Événements" },
  { value: "request", label: "Demandes" },
  { value: "document", label: "Documents" },
  { value: "task", label: "Tâches" },
  { value: "project", label: "Projet" },
];

const TYPE_COLORS: Record<string, { dot: string; ring: string }> = {
  creation: { dot: "bg-green-500", ring: "ring-green-500/20" },
  modification: { dot: "bg-blue-500", ring: "ring-blue-500/20" },
  suppression: { dot: "bg-red-500", ring: "ring-red-500/20" },
  commentaire: { dot: "bg-gray-400", ring: "ring-gray-400/20" },
  changement_statut: { dot: "bg-violet-500", ring: "ring-violet-500/20" },
};

const DEFAULT_COLOR = { dot: "bg-gray-400", ring: "ring-gray-400/20" };

const TYPE_LABELS: Record<string, string> = {
  creation: "Création",
  modification: "Modification",
  suppression: "Suppression",
  commentaire: "Commentaire",
  changement_statut: "Changement de statut",
};

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (startOfDate.getTime() === startOfToday.getTime()) {
    return "Aujourd\u2019hui";
  }
  if (startOfDate.getTime() === startOfYesterday.getTime()) {
    return "Hier";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function groupActivitiesByDate(activities: Activity[]): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>();
  for (const activity of activities) {
    const label = getDateLabel(activity.createdAt);
    const existing = groups.get(label);
    if (existing) {
      existing.push(activity);
    } else {
      groups.set(label, [activity]);
    }
  }
  return groups;
}

export default function HistoriquePage() {
  const [data, setData] = useState<ActivitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const limit = 20;

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (entityType) params.set("entityType", entityType);
      if (authorFilter.trim()) params.set("author", authorFilter.trim());

      const res = await fetch(`/api/activities?${params}`);
      if (!res.ok) throw new Error("Erreur réseau");
      const json: ActivitiesResponse = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, entityType, authorFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const groupedActivities = useMemo(() => {
    if (!data?.activities) return new Map<string, Activity[]>();
    return groupActivitiesByDate(data.activities);
  }, [data]);

  function handleEntityTypeChange(value: string | null) {
    setEntityType(value ?? "");
    setPage(1);
  }

  function handleAuthorChange(value: string) {
    setAuthorFilter(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historique"
        description="Journal de toutes les activités du chantier"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={entityType} onValueChange={handleEntityTypeChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Filtrer par auteur..."
          value={authorFilter}
          onChange={(e) => handleAuthorChange(e.target.value)}
          className="w-full sm:w-[200px]"
        />
      </div>

      {loading ? (
        <div className="space-y-8">
          {Array.from({ length: 2 }).map((_, gi) => (
            <div key={gi} className="space-y-0">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="relative pl-8">
                <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="relative pb-6 last:pb-0">
                    <Skeleton className="absolute left-[-23px] top-1 h-[18px] w-[18px] rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : !data || data.activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">Aucune activité</h3>
            <p className="text-sm text-muted-foreground">
              L&apos;historique des activités apparaîtra ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-8">
            {Array.from(groupedActivities.entries()).map(
              ([dateLabel, activities]) => (
                <section key={dateLabel}>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    {dateLabel}
                  </h2>

                  <div className="relative pl-8">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[9px] top-1 bottom-1 w-px bg-border" />

                    {activities.map((activity, idx) => {
                      const colors =
                        TYPE_COLORS[activity.type] ?? DEFAULT_COLOR;
                      const typeLabel =
                        TYPE_LABELS[activity.type] ?? activity.type;
                      const isLast = idx === activities.length - 1;

                      return (
                        <div
                          key={activity.id}
                          className={`relative ${isLast ? "" : "pb-6"}`}
                        >
                          {/* Timeline dot */}
                          <div
                            className={`absolute left-[-23px] top-1 h-[18px] w-[18px] rounded-full ${colors.dot} ring-4 ${colors.ring} flex items-center justify-center`}
                          >
                            <div className="h-2 w-2 rounded-full bg-white/80" />
                          </div>

                          {/* Activity content */}
                          <div className="min-w-0">
                            <p className="text-sm leading-relaxed">
                              <span className="font-medium">
                                {activity.author}
                              </span>{" "}
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded ${
                                  activity.type === "creation"
                                    ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                                    : activity.type === "modification"
                                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                      : activity.type === "suppression"
                                        ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                                        : activity.type === "changement_statut"
                                          ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                                          : "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {typeLabel}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(activity.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )
            )}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.page} sur {data.totalPages} ({data.total} activités)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(data.totalPages, p + 1))
                  }
                  disabled={page >= data.totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
