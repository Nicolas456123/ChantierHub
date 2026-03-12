import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/format";
import { REQUEST_TYPES, REQUEST_STATUSES } from "@/lib/constants";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { StatusChanger } from "./status-changer";
import { CommentSection } from "./comment-section";
import { DeleteRequest } from "./delete-request";

export const dynamic = "force-dynamic";

interface DemandeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DemandeDetailPage({
  params,
}: DemandeDetailPageProps) {
  const { id } = await params;

  const requestItem = await prisma.request.findUnique({
    where: { id },
    include: {
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!requestItem) {
    notFound();
  }

  const statusInfo = REQUEST_STATUSES.find(
    (s) => s.value === requestItem.status
  );
  const typeInfo = REQUEST_TYPES.find((t) => t.value === requestItem.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/demandes">
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
                  <CardTitle className="text-xl">{requestItem.title}</CardTitle>
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
                <DeleteRequest requestId={requestItem.id} requestTitle={requestItem.title} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {requestItem.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Description
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {requestItem.description}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Auteur:</span>
                  <span className="font-medium">{requestItem.author}</span>
                </div>

                {requestItem.assignedTo && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Assignee a:</span>
                    <span className="font-medium">{requestItem.assignedTo}</span>
                  </div>
                )}

                {requestItem.dueDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Echeance:</span>
                    <span className="font-medium">
                      {formatDate(requestItem.dueDate)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Creee le:</span>
                  <span className="font-medium">
                    {formatDateTime(requestItem.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <CommentSection
            requestId={requestItem.id}
            initialComments={requestItem.comments.map((c) => ({
              id: c.id,
              content: c.content,
              author: c.author,
              createdAt: c.createdAt.toISOString(),
            }))}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Changer le statut</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusChanger
                requestId={requestItem.id}
                currentStatus={requestItem.status}
                requestData={{
                  title: requestItem.title,
                  description: requestItem.description || undefined,
                  type: requestItem.type,
                  assignedTo: requestItem.assignedTo || undefined,
                  dueDate: requestItem.dueDate
                    ? requestItem.dueDate.toISOString().split("T")[0]
                    : undefined,
                }}
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
                <span className="font-medium">{typeInfo?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commentaires</span>
                <span className="font-medium">{requestItem.comments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Derniere mise a jour</span>
                <span className="font-medium">
                  {formatRelativeTime(requestItem.updatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
