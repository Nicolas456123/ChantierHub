"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
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

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/comments?entityType=${entityType}&entityId=${entityId}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(data);
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
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch {
      toast.error("Erreur lors de l'envoi du commentaire");
    } finally {
      setSubmitting(false);
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
                className="bg-gray-50 rounded-lg p-3 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0 self-end"
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
