"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CONSTRAINT_TYPES, CONSTRAINT_STATUSES, PENALTY_UNITS } from "@/lib/constants";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ModifierContraintePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [responsible, setResponsible] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyUnit, setPenaltyUnit] = useState("");
  const [penaltyDetails, setPenaltyDetails] = useState("");

  useEffect(() => {
    async function fetchConstraint() {
      try {
        const res = await fetch(`/api/constraints/${id}`);
        if (!res.ok) throw new Error("Contrainte non trouvée");
        const data = await res.json();
        setTitle(data.title || "");
        setDescription(data.description || "");
        setType(data.type || "");
        setStatus(data.status || "active");
        setResponsible(data.responsible || "");
        setDueDate(data.dueDate ? data.dueDate.split("T")[0] : "");
        setPenaltyAmount(data.penaltyAmount ? String(data.penaltyAmount) : "");
        setPenaltyUnit(data.penaltyUnit || "");
        setPenaltyDetails(data.penaltyDetails || "");
      } catch {
        toast.error("Impossible de charger la contrainte");
        router.push("/contraintes");
      } finally {
        setLoading(false);
      }
    }
    fetchConstraint();
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/constraints/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          type: type || "contractuelle",
          status: status || "active",
          responsible: responsible.trim() || undefined,
          dueDate: dueDate || undefined,
          penaltyAmount: penaltyAmount ? parseFloat(penaltyAmount) : undefined,
          penaltyUnit: penaltyUnit || undefined,
          penaltyDetails: penaltyDetails.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la modification");
      }

      toast.success("Contrainte modifiée avec succès");
      router.push(`/contraintes/${id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la modification"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/contraintes/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Modifier la contrainte
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la contrainte</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                placeholder="Titre de la contrainte"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez la contrainte en détail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v) => v && setType(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez un type">
                      {type
                        ? CONSTRAINT_TYPES.find((t) => t.value === type)?.label
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CONSTRAINT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez un statut">
                      {status
                        ? CONSTRAINT_STATUSES.find((s) => s.value === status)?.label
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CONSTRAINT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="responsible">Responsable</Label>
                <Input
                  id="responsible"
                  placeholder="Nom du responsable"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Date d&apos;échéance</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <h3 className="text-sm font-medium">Pénalités</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="penaltyAmount">Montant de la pénalité</Label>
                <Input
                  id="penaltyAmount"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="penaltyUnit">Unité de pénalité</Label>
                <Select
                  value={penaltyUnit}
                  onValueChange={(v) => v && setPenaltyUnit(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez une unité">
                      {penaltyUnit
                        ? PENALTY_UNITS.find((u) => u.value === penaltyUnit)?.label
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PENALTY_UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="penaltyDetails">Détails de la pénalité</Label>
              <Textarea
                id="penaltyDetails"
                placeholder="Conditions d'application de la pénalité..."
                value={penaltyDetails}
                onChange={(e) => setPenaltyDetails(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                )}
                Enregistrer les modifications
              </Button>
              <Link href={`/contraintes/${id}`}>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
