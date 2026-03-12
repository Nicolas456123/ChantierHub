"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { CONSTRAINT_TYPES, PENALTY_UNITS } from "@/lib/constants";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NouvelleContraintePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [responsible, setResponsible] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyUnit, setPenaltyUnit] = useState("");
  const [penaltyDetails, setPenaltyDetails] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/constraints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          type: type || undefined,
          responsible: responsible.trim() || undefined,
          dueDate: dueDate || undefined,
          penaltyAmount: penaltyAmount ? parseFloat(penaltyAmount) : undefined,
          penaltyUnit: penaltyUnit || undefined,
          penaltyDetails: penaltyDetails.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la creation");
      }

      toast.success("Contrainte creee avec succes");
      router.push("/contraintes");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la creation"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contraintes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Nouvelle contrainte
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
                placeholder="Decrivez la contrainte en detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectionnez un type">
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
              <Label htmlFor="responsible">Responsable</Label>
              <Input
                id="responsible"
                placeholder="Nom du responsable"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Date d&apos;echeance</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <Separator />

            <h3 className="text-sm font-medium">Penalites</h3>

            <div className="space-y-2">
              <Label htmlFor="penaltyAmount">Montant de la penalite</Label>
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
              <Label htmlFor="penaltyUnit">Unite de penalite</Label>
              <Select
                value={penaltyUnit}
                onValueChange={(v) => v && setPenaltyUnit(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectionnez une unite">
                    {penaltyUnit
                      ? PENALTY_UNITS.find((u) => u.value === penaltyUnit)
                          ?.label
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

            <div className="space-y-2">
              <Label htmlFor="penaltyDetails">Details de la penalite</Label>
              <Textarea
                id="penaltyDetails"
                placeholder="Conditions d'application de la penalite..."
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
                Creer la contrainte
              </Button>
              <Link href="/contraintes">
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
