"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUSES, PRIORITIES } from "@/lib/constants";
import { Calendar, User, Clock, Pencil, Loader2, X, Check } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/format";
import { DeleteTaskButton } from "./delete-task-button";

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  author: string;
  assignedTo: string | null;
  dueDate: string | null;
  createdAt: string;
}

interface EditTaskProps {
  task: TaskData;
}

export function EditTask({ task }: EditTaskProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || "");
  const [dueDate, setDueDate] = useState(task.dueDate || "");

  const statusInfo = TASK_STATUSES.find((s) => s.value === task.status);
  const priorityInfo = PRIORITIES.find((p) => p.value === task.priority);

  function handleCancel() {
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setAssignedTo(task.assignedTo || "");
    setDueDate(task.dueDate || "");
    setIsEditing(false);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          assignedTo: assignedTo.trim() || undefined,
          dueDate: dueDate || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      toast.success("Tâche modifiée");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="space-y-1">
                <Label htmlFor="edit-title">Titre</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de la tâche"
                  maxLength={200}
                />
              </div>
            ) : (
              <>
                <CardTitle className="text-xl">{task.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {statusInfo && (
                    <Badge variant="secondary" className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                  )}
                  {priorityInfo && priorityInfo.value !== "normale" && (
                    <Badge variant="secondary" className={priorityInfo.color}>
                      {priorityInfo.label}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Enregistrer
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <DeleteTaskButton id={task.id} name={task.title} />
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optionnel)"
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Statut</Label>
                <Select value={status} onValueChange={(v) => { if (v) setStatus(v); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Priorité</Label>
                <Select value={priority} onValueChange={(v) => { if (v) setPriority(v); }}>
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
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-assignedTo">Assignée à</Label>
                <Input
                  id="edit-assignedTo"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Nom de la personne"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-dueDate">Échéance</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {task.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </h3>
                <p className="text-sm whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Auteur:</span>
                <span className="font-medium">{task.author}</span>
              </div>

              {task.assignedTo && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assignée à:</span>
                  <span className="font-medium">{task.assignedTo}</span>
                </div>
              )}

              {task.dueDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Échéance:</span>
                  <span className="font-medium">
                    {formatDate(new Date(task.dueDate))}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Créée le:</span>
                <span className="font-medium">
                  {formatDateTime(new Date(task.createdAt))}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
