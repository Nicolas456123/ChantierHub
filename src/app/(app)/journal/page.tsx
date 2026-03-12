import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { EVENT_CATEGORIES, PRIORITIES } from "@/lib/constants";
import { Plus, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const projectId = await getCurrentProjectId();

  const events = await prisma.event.findMany({
    where: { projectId },
    orderBy: { date: "desc" },
  });

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

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">Aucun événement</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Commencez par créer votre premier événement dans le journal.
            </p>
            <Link href="/journal/nouveau">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Créer un événement
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
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
                        <p className="text-xs text-muted-foreground mt-2">
                          {event.author} &middot; {formatDate(event.date)}
                        </p>
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
