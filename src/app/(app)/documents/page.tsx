import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatFileSize } from "@/lib/format";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { Plus, FolderOpen, Download } from "lucide-react";
import { DeleteDocumentButton } from "./delete-document-button";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Gestion des documents du chantier"
        action={
          <Link href="/documents/nouveau">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un document
            </Button>
          </Link>
        }
      />

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">Aucun document</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Commencez par ajouter votre premier document.
            </p>
            <Link href="/documents/nouveau">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un document
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const category = DOCUMENT_CATEGORIES.find(
              (c) => c.value === doc.category
            );

            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{doc.name}</h3>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {doc.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {category && (
                        <Badge variant="secondary">{category.label}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {doc.author} &middot; {formatDate(doc.createdAt)}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      </a>
                      <DeleteDocumentButton id={doc.id} name={doc.name} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
