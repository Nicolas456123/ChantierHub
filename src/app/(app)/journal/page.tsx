import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { EVENT_CATEGORIES, PRIORITIES } from "@/lib/constants";
import { Plus, BookOpen, MessageSquare } from "lucide-react";
import { ListFilters } from "@/components/list-filters";
import { ExportCsvButton } from "@/components/export-csv-button";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function JournalPage({ searchParams }: Props) {
  const params = await searchParams;
  const projectId = await getCurrentProjectId();
  const search = params.q?.trim().toLowerCase() ?? "";
  const categoryFilter = params.category ?? "";

  const events = await prisma.event.findMany({
    where: {
      projectId,
      ...(categoryFilter ? { category: categoryFilter } : {}),
    },
    orderBy: { date: "desc" },
  });

  // Client-side search (title + description + author)
  const filtered = search
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(search) ||
          (e.description ?? "").toLowerCase().includes(search) ||
          e.author.toLowerCase().includes(search)
      )
    : events;

  const eventIds = filtered.map((e) => e.id);
  const commentCounts =
    eventIds.length > 0
      ? await prisma.comment.groupBy({
          by: ["entityId"],
          where: { entityType: "event", entityId: { in: eventIds } },
          _count: true,
        })
      : [];
  const commentCountMap = new Map(
    commentCounts.map((c) => [c.entityId, c._count])
  );

  // Count per category for badges
  const allEvents = await prisma.event.findMany({
    where: { projectId },
    select: { category: true },
  });
  const categoryCounts = EVENT_CATEGORIES.map((cat) => ({
    value: cat.value,
    label: cat.label,
    count: allEvents.filter((e) => e.category === cat.value).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal de chantier"
        description="Suivi chronologique des événements du chantier"
        action={
          <Link href="/journal/nouveau">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel événement
            </Button>
          </Link>
        }
      />

      <ListFilters
        searchPlaceholder="Rechercher un événement…"
        tabs={categoryCounts}
        tabParam="category"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">
              {search || categoryFilter ? "Aucun résultat" : "Aucun événement"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || categoryFilter
                ? "Essayez de modifier vos filtres."
                : "Commencez par créer votre premier événement dans le journal."}
            </p>
            {!search && !categoryFilter && (
              <Link href="/journal/nouveau">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un événement
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} événement{filtered.length > 1 ? "s" : ""}
            </p>
            <ExportCsvButton
              filename={`journal-${new Date().toISOString().split("T")[0]}`}
              columns={[
                { key: "title", label: "Titre" },
                { key: "category", label: "Catégorie" },
                { key: "priority", label: "Priorité" },
                { key: "description", label: "Description" },
                { key: "author", label: "Auteur" },
                { key: "date", label: "Date" },
              ]}
              data={filtered.map((e) => ({
                title: e.title,
                category: EVENT_CATEGORIES.find((c) => c.value === e.category)?.label ?? e.category,
                priority: PRIORITIES.find((p) => p.value === e.priority)?.label ?? e.priority,
                description: e.description ?? "",
                author: e.author,
                date: formatDate(e.date),
              }))}
            />
          </div>
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 350px), 1fr))",
            }}
          >
            {filtered.map((event) => {
              const category = EVENT_CATEGORIES.find(
                (c) => c.value === event.category
              );
              const priority = PRIORITIES.find(
                (p) => p.value === event.priority
              );

              return (
                <Link key={event.id} href={`/journal/${event.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">
                              {event.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {category && (
                              <Badge variant="secondary">
                                {category.label}
                              </Badge>
                            )}
                            {priority && priority.value !== "normale" && (
                              <Badge
                                variant="secondary"
                                className={priority.color}
                              >
                                {priority.label}
                              </Badge>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            <span>
                              {event.author} &middot; {formatDate(event.date)}
                            </span>
                            {(commentCountMap.get(event.id) ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {commentCountMap.get(event.id)}
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
        </>
      )}
    </div>
  );
}
