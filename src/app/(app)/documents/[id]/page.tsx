import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatFileSize } from "@/lib/format";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { ArrowLeft, Download } from "lucide-react";
import { DocumentPreview } from "@/components/documents/document-preview";
import { CommentsSection } from "@/components/comments-section";
import { DeleteDocumentButton } from "../delete-document-button";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectId = await getCurrentProjectId();

  const document = await prisma.document.findFirst({
    where: { id, projectId },
  });

  if (!document) {
    notFound();
  }

  const category = DOCUMENT_CATEGORIES.find((c) => c.value === document.category);

  return (
    <div className="space-y-6">
      <PageHeader
        title={document.name}
        description={document.description || undefined}
        action={
          <Link href="/documents">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        }
      />

      {/* Metadata + Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {category && <Badge variant="secondary">{category.label}</Badge>}
            <span className="text-sm text-muted-foreground">
              {formatFileSize(document.fileSize)}
            </span>
            <span className="text-sm text-muted-foreground">
              {document.author} &middot; {formatDate(document.createdAt)}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <a href={`/api/documents/${document.id}/download`}>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </a>
              <DeleteDocumentButton id={document.id} name={document.name} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardContent className="p-4">
          <DocumentPreview
            documentId={document.id}
            mimeType={document.mimeType}
            fileName={document.fileName}
          />
        </CardContent>
      </Card>

      <CommentsSection entityType="document" entityId={document.id} />
    </div>
  );
}
