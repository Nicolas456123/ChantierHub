"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquare, Send, User } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface CommentSectionProps {
  requestId: string;
  initialComments: Comment[];
}

function formatCommentDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentSection({
  requestId,
  initialComments,
}: CommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error("Le commentaire ne peut pas etre vide");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/requests/${requestId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'ajout du commentaire");
      }

      const comment = await res.json();
      setComments((prev) => [
        ...prev,
        {
          id: comment.id,
          content: comment.content,
          author: comment.author,
          createdAt: comment.createdAt,
        },
      ]);
      setNewComment("");
      toast.success("Commentaire ajoute");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'ajout du commentaire"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Commentaires ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments list */}
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun commentaire pour le moment.
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <div key={comment.id}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {comment.author}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap pl-5.5">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add comment form */}
        <Separator />
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <Textarea
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Envoyer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
