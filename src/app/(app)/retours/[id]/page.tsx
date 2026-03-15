"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FEEDBACK_TYPES, FEEDBACK_STATUSES, PRIORITIES } from "@/lib/constants";
import { ArrowLeft, Bug, Lightbulb, MessageCircle, Loader2, Trash2, Send } from "lucide-react";
import { formatRelativeTime } from "@/lib/format";
import Link from "next/link";

interface Feedback {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: { firstName: string; lastName: string; email: string };
}

interface Reply {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface MeResponse {
  id: string;
  isGlobalAdmin: boolean;
}

const typeIcons: Record<string, typeof Bug> = {
  bug: Bug,
  suggestion: Lightbulb,
  autre: MessageCircle,
};

export default function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/feedback/${id}`).then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
      fetch(`/api/feedback/${id}/replies`).then((r) => r.ok ? r.json() : []),
    ])
      .then(([fb, user, reps]) => {
        if (fb.error) {
          toast.error(fb.error);
          router.push("/retours");
          return;
        }
        setFeedback(fb);
        setMe(user);
        setReplies(reps);
      })
      .catch(() => toast.error("Erreur lors du chargement"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function updateField(field: string, value: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setFeedback((prev) => prev ? { ...prev, ...updated } : prev);
      toast.success("Mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/feedback/${id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim() }),
      });
      if (!res.ok) throw new Error();
      const reply = await res.json();
      setReplies((prev) => [...prev, reply]);
      setReplyContent("");
      toast.success("Réponse envoyée");
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSendingReply(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer ce retour ?")) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Retour supprimé");
      router.push("/retours");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!feedback) return null;

  const isAdmin = me?.isGlobalAdmin ?? false;
  const isOwner = me?.id === feedback.userId;
  const canReply = isAdmin || isOwner;
  const typeInfo = FEEDBACK_TYPES.find((t) => t.value === feedback.type);
  const statusInfo = FEEDBACK_STATUSES.find((s) => s.value === feedback.status);
  const priorityInfo = PRIORITIES.find((p) => p.value === feedback.priority);
  const TypeIcon = typeIcons[feedback.type] ?? MessageCircle;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/retours">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TypeIcon className="h-6 w-6" />
          {feedback.title}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{feedback.description}</p>
            </CardContent>
          </Card>

          {/* Replies section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Réponses ({replies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {replies.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune réponse pour le moment
                </p>
              )}

              {replies.map((reply) => (
                <div key={reply.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{reply.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                </div>
              ))}

              {canReply && (
                <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Écrire une réponse..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sendingReply || !replyContent.trim()}
                    className="shrink-0 self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <Badge variant="outline">{typeInfo?.label ?? feedback.type}</Badge>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Statut</p>
                {isAdmin ? (
                  <Select
                    value={feedback.status}
                    onValueChange={(v) => v && updateField("status", v)}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FEEDBACK_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    variant="secondary"
                    className={statusInfo?.color}
                  >
                    {statusInfo?.label ?? feedback.status}
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Priorité</p>
                {isAdmin ? (
                  <Select
                    value={feedback.priority}
                    onValueChange={(v) => v && updateField("priority", v)}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    variant="secondary"
                    className={priorityInfo?.color}
                  >
                    {priorityInfo?.label ?? feedback.priority}
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Auteur</p>
                <p className="text-sm font-medium">
                  {feedback.user.firstName} {feedback.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{feedback.user.email}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Date</p>
                <p className="text-sm">
                  {new Date(feedback.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full mt-4"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
