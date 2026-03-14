import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatFileSize } from "@/lib/format";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { Plus, FolderOpen, Download, Eye, MessageSquare } from "lucide-react";
import { DeleteDocumentButton } from "./delete-document-button";
import { ListFilters } from "@/components/list-filters";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function DocumentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const projectId = await getCurrentProjectId();
  const search = params.q?.trim().toLowerCase() ?? "";
  const categoryFilter = params.category ?? "";

  const documents = await prisma.document.findMany({
    where: {
      projectId,
      ...(categoryFilter ? { category: categoryFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = search
    ? documents.filter(
        (d) =>
          d.name.toLowerCase().includes(search) ||
          (d.description ?? "").toLowerCase().includes(search) ||
          d.author.toLowerCase().includes(search)
      )
    : documents;

  const docIds = filtered.map((d) => d.id);
  const commentCounts =
    docIds.length > 0
      ? await prisma.comment.groupBy({
          by: ["entityId"],
          where: { entityType: "document", entityId: { in: docIds } },
          _count: true,
        })
      : [];
  const commentCountMap = new Map(
    commentCounts.map((c) => [c.entityId, c._count])
  );

  // Count per category
  const allDocs = await prisma.document.findMany({
    where: { projectId },
    select: { category: true },
  });
  const categoryCounts = DOCUMENT_CATEGORIES.map((cat) => ({
    value: cat.value,
    label: cat.label,
    count: allDocs.filter((d) => d.category === cat.value).length,
  })).filter((c) => c.count > 0);

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

      <ListFilters
        searchPlaceholder="Rechercher un document…"
        tabs={categoryCounts}
        tabParam="category"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">
              {search || categoryFilter ? "Aucun résultat" : "Aucun document"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || categoryFilter
                ? "Essayez de modifier vos filtres."
                : "Commencez par ajouter votre premier document."}
            </p>
            {!search && !categoryFilter && (
              <Link href="/documents/nouveau">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un document
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filtered.length} document{filtered.length > 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doc) => {
              const category = DOCUMENT_CATEGORIES.find(
                (c) => c.value === doc.category
              );

              return (
                <Card
                  key={doc.id}
                  className="hover:shadow-md transition-shadow"
                >
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
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {doc.author} &middot; {formatDate(doc.createdAt)}
                        </span>
                        {(commentCountMap.get(doc.id) ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {commentCountMap.get(doc.id)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="flex-1"
                        >
                          <Button size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                        </Link>
                        <a href={`/api/documents/${doc.id}/download`}>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
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
        </>
      )}
    </div>
  );
}
