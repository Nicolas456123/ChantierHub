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
import { REQUEST_TYPES, REQUEST_STATUSES } from "@/lib/constants";
import { Calendar, User, Clock, Pencil, Loader2, X, Check } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/format";
import { DeleteRequest } from "./delete-request";

interface RequestData {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  author: string;
  assignedTo: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EditRequestProps {
  request: RequestData;
}

export function EditRequest({ request }: EditRequestProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description || "");
  const [type, setType] = useState(request.type);
  const [assignedTo, setAssignedTo] = useState(request.assignedTo || "");
  const [dueDate, setDueDate] = useState(request.dueDate || "");

  const statusInfo = REQUEST_STATUSES.find((s) => s.value === request.status);
  const typeInfo = REQUEST_TYPES.find((t) => t.value === request.type);

  function handleCancel() {
    setTitle(request.title);
    setDescription(request.description || "");
    setType(request.type);
    setAssignedTo(request.assignedTo || "");
    setDueDate(request.dueDate || "");
    setIsEditing(false);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          type,
          status: request.status,
          assignedTo: assignedTo.trim() || undefined,
          dueDate: dueDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise a jour");
      }

      toast.success("Demande modifiee");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise a jour"
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
                  placeholder="Titre de la demande"
                  maxLength={200}
                />
              </div>
            ) : (
              <>
                <CardTitle className="text-xl">{request.title}</CardTitle>
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
                <DeleteRequest
                  requestId={request.id}
                  requestTitle={request.title}
                />
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
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => { if (v) setType(v); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-assignedTo">Assigne a</Label>
                <Input
                  id="edit-assignedTo"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Nom de la personne"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-dueDate">Echeance</Label>
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
            {request.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </h3>
                <p className="text-sm whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>
            )}

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Auteur:</span>
                <span className="font-medium">{request.author}</span>
              </div>

              {request.assignedTo && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assignee a:</span>
                  <span className="font-medium">{request.assignedTo}</span>
                </div>
              )}

              {request.dueDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Echeance:</span>
                  <span className="font-medium">
                    {formatDate(new Date(request.dueDate))}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Creee le:</span>
                <span className="font-medium">
                  {formatDateTime(new Date(request.createdAt))}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
