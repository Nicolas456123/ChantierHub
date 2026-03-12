import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime } from "@/lib/format";
import { EVENT_CATEGORIES, PRIORITIES } from "@/lib/constants";
import { ArrowLeft, Pencil } from "lucide-react";
import { DeleteEventButton } from "./delete-button";

export const dynamic = "force-dynamic";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event) {
    notFound();
  }

  const category = EVENT_CATEGORIES.find((c) => c.value === event.category);
  const priority = PRIORITIES.find((p) => p.value === event.priority);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/journal">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
      </div>

      <PageHeader
        title={event.title}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/journal/${event.id}/modifier`}>
              <Button variant="outline">
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </Link>
            <DeleteEventButton eventId={event.id} eventTitle={event.title} />
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Détails de l&apos;événement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Catégorie
              </p>
              <div className="mt-1">
                {category && (
                  <Badge variant="secondary">{category.label}</Badge>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Priorité
              </p>
              <div className="mt-1">
                {priority && (
                  <Badge variant="secondary" className={priority.color}>
                    {priority.label}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="mt-1 text-sm">{formatDate(event.date)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Auteur
              </p>
              <p className="mt-1 text-sm">{event.author}</p>
            </div>
          </div>

          {event.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="text-xs text-muted-foreground">
            Créé le {formatDateTime(event.createdAt)} &middot; Dernière
            modification le {formatDateTime(event.updatedAt)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
