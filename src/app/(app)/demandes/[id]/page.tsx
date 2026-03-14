import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";
import { REQUEST_TYPES, REQUEST_STATUSES } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import { CommentsSection } from "@/components/comments-section";
import { StatusChanger } from "./status-changer";
import { EditRequest } from "./edit-request";
import { RequestPhotos } from "./request-photos";

export const dynamic = "force-dynamic";

interface DemandeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DemandeDetailPage({
  params,
}: DemandeDetailPageProps) {
  const { id } = await params;
  const projectId = await getCurrentProjectId();

  const requestItem = await prisma.request.findFirst({
    where: { id, projectId },
    include: {
      _count: { select: { comments: true } },
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
          <EditRequest
            request={{
              id: requestItem.id,
              title: requestItem.title,
              description: requestItem.description,
              type: requestItem.type,
              status: requestItem.status,
              author: requestItem.author,
              assignedTo: requestItem.assignedTo,
              dueDate: requestItem.dueDate
                ? requestItem.dueDate.toISOString().split("T")[0]
                : null,
              createdAt: requestItem.createdAt.toISOString(),
              updatedAt: requestItem.updatedAt.toISOString(),
            }}
          />

          {/* Photos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestPhotos requestId={requestItem.id} />
            </CardContent>
          </Card>

          {/* Comments */}
          <CommentsSection entityType="request" entityId={requestItem.id} />
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
                <span className="font-medium">{requestItem._count.comments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dernière mise à jour</span>
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
