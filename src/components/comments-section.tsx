"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import {
  MessageSquare,
  Send,
  Loader2,
  Pencil,
  Trash2,
  X,
  Check,
  ImagePlus,
} from "lucide-react";
import { PhotoUpload } from "@/components/photo-upload";

interface Photo {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  caption?: string | null;
  author: string;
  entityType: string;
  entityId: string;
  projectId: string;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  photos?: Photo[];
}

interface CommentsSectionProps {
  entityType: string;
  entityId: string;
}

export function CommentsSection({ entityType, entityId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) node.value = "";
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/comments?entityType=${entityType}&entityId=${entityId}`
      );
      if (!res.ok) throw new Error();
      const data: Comment[] = await res.json();

      // Fetch photos for all comments in parallel
      const withPhotos = await Promise.all(
        data.map(async (comment) => {
          try {
            const photosRes = await fetch(
              `/api/photos?entityType=comment&entityId=${comment.id}`
            );
            if (photosRes.ok) {
              const photos = await photosRes.json();
              return { ...comment, photos };
            }
          } catch {
            // ignore
          }
          return { ...comment, photos: [] };
        })
      );
      setComments(withPhotos);
    } catch {
      // Silent fail on load
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim(),
          entityType,
          entityId,
        }),
      });
      if (!res.ok) throw new Error();
      const comment = await res.json();

      // Upload pending photos for this comment
      const uploadedPhotos: Photo[] = [];
      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("entityType", "comment");
        formData.append("entityId", comment.id);
        try {
          const photoRes = await fetch("/api/photos", {
            method: "POST",
            body: formData,
          });
          if (photoRes.ok) {
            uploadedPhotos.push(await photoRes.json());
          }
        } catch {
          // ignore individual photo errors
        }
      }

      setComments((prev) => [...prev, { ...comment, photos: uploadedPhotos }]);
      setNewComment("");
      setPendingFiles([]);
    } catch {
      toast.error("Erreur lors de l'envoi du commentaire");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(id: string) {
    if (!editContent.trim()) return;
    try {
      const res = await fetch("/api/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, content: editContent.trim() }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, content: updated.content } : c))
      );
      setEditingId(null);
      setEditContent("");
    } catch {
      toast.error("Erreur lors de la modification");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce commentaire ?")) return;
    try {
      const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Commentaires
          {comments.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Aucun commentaire
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-gray-50 rounded-lg p-3 space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{comment.author}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                    {editingId !== comment.id && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      className="resize-none text-sm"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleEdit(comment.id)}
                        disabled={!editContent.trim()}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Enregistrer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          setEditingId(null);
                          setEditContent("");
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    <div className="mt-2">
                      <PhotoUpload
                        entityType="comment"
                        entityId={comment.id}
                        photos={comment.photos || []}
                        onPhotosChange={(photos) =>
                          setComments((prev) =>
                            prev.map((c) =>
                              c.id === comment.id ? { ...c, photos } : c
                            )
                          )
                        }
                        maxPhotos={5}
                        compact
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <div className="flex flex-col gap-1 shrink-0 self-end">
              <label className="cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setPendingFiles((prev) => [
                        ...prev,
                        ...Array.from(e.target.files!),
                      ]);
                    }
                  }}
                />
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                  <ImagePlus className="h-4 w-4" />
                </div>
              </label>
              <Button
                type="submit"
                size="icon"
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((file, idx) => (
                <div key={idx} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-12 w-12 rounded object-cover border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
