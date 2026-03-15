import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserId, isGlobalAdmin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { formatRelativeTime } from "@/lib/format";
import { FEEDBACK_TYPES, FEEDBACK_STATUSES, PRIORITIES } from "@/lib/constants";
import { Plus, MessageSquarePlus, User, Bug, Lightbulb, MessageCircle } from "lucide-react";
import { ListFilters } from "@/components/list-filters";

export const dynamic = "force-dynamic";

interface RetoursPageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

const typeIcons: Record<string, typeof Bug> = {
  bug: Bug,
  suggestion: Lightbulb,
  autre: MessageCircle,
};

export default async function RetoursPage({ searchParams }: RetoursPageProps) {
  const params = await searchParams;
  const userId = await getUserId();
  const admin = await isGlobalAdmin();
  const statusFilter = params.status ?? "";
  const search = params.q?.trim().toLowerCase() ?? "";

  const where: Record<string, unknown> = {};
  if (!admin) {
    where.userId = userId;
  }
  if (statusFilter) {
    where.status = statusFilter;
  }

  const feedbacks = await prisma.feedback.findMany({
    where,
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = search
    ? feedbacks.filter(
        (f) =>
          f.title.toLowerCase().includes(search) ||
          f.description.toLowerCase().includes(search)
      )
    : feedbacks;

  // Status counts for tabs
  const allFeedbacks = await prisma.feedback.findMany({
    where: admin ? {} : { userId },
    select: { status: true },
  });
  const statusTabs = FEEDBACK_STATUSES.map((s) => ({
    value: s.value,
    label: s.label,
    color: s.color,
    count: allFeedbacks.filter((f) => f.status === s.value).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retours & Bugs"
        description="Signalez des bugs ou proposez des améliorations"
        action={
          <Link href="/retours/nouveau">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Nouveau retour
            </Button>
          </Link>
        }
      />

      <ListFilters
        searchPlaceholder="Rechercher un retour…"
        tabs={statusTabs}
        tabParam="status"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquarePlus className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {search || statusFilter ? "Aucun résultat" : "Aucun retour"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || statusFilter
                ? "Essayez de modifier vos filtres."
                : "Signalez un bug ou proposez une amélioration."}
            </p>
            {!search && !statusFilter && (
              <Link href="/retours/nouveau" className="mt-4">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Nouveau retour
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filtered.length} retour{filtered.length > 1 ? "s" : ""}
          </p>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 350px), 1fr))",
            }}
          >
            {filtered.map((fb) => {
              const statusInfo = FEEDBACK_STATUSES.find(
                (s) => s.value === fb.status
              );
              const typeInfo = FEEDBACK_TYPES.find((t) => t.value === fb.type);
              const priorityInfo = PRIORITIES.find(
                (p) => p.value === fb.priority
              );
              const TypeIcon = typeIcons[fb.type] ?? MessageCircle;

              return (
                <Link key={fb.id} href={`/retours/${fb.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <h3 className="font-medium truncate">
                              {fb.title}
                            </h3>
                          </div>
                          {fb.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {fb.description}
                            </p>
                          )}
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
                            {priorityInfo && fb.priority !== "normale" && (
                              <Badge
                                variant="secondary"
                                className={`text-xs ${priorityInfo.color}`}
                              >
                                {priorityInfo.label}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {fb.user.firstName} {fb.user.lastName}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          {formatRelativeTime(fb.createdAt)}
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
