"use client";

import { useState, useEffect, useCallback } from "react";
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

const TYPE_COLORS: Record<string, string> = {
  creation: "bg-green-500",
  modification: "bg-blue-500",
  suppression: "bg-red-500",
};

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
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
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
          <div className="space-y-2">
            {data.activities.map((activity) => {
              const dotColor =
                TYPE_COLORS[activity.type] ?? "bg-gray-400";

              return (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-3 w-3 rounded-full mt-1.5 shrink-0 ${dotColor}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.author}
                          </span>{" "}
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
