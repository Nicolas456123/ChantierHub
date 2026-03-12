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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CONSTRAINT_CATEGORIES,
  CONSTRAINT_CATEGORY_GROUPS,
  PENALTY_PER,
  PENALTY_CAP_UNITS,
  RECURRENCE_TYPES,
} from "@/lib/constants";
import { ArrowLeft, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function NouvelleContraintePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Essentiels
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyPer, setPenaltyPer] = useState("");
  const [responsible, setResponsible] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Avancés
  const [articleRef, setArticleRef] = useState("");
  const [sourceDocument, setSourceDocument] = useState("");
  const [penaltyFormula, setPenaltyFormula] = useState("");
  const [penaltyCap, setPenaltyCap] = useState("");
  const [penaltyCapUnit, setPenaltyCapUnit] = useState("");
  const [escalation, setEscalation] = useState("");
  const [condition, setCondition] = useState("");
  const [penaltyDetails, setPenaltyDetails] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("");
  const [recurrenceDay, setRecurrenceDay] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (!category) {
      toast.error("La catégorie est requise");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/constraints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim() || undefined,
          articleRef: articleRef.trim() || undefined,
          sourceDocument: sourceDocument.trim() || undefined,
          responsible: responsible.trim() || undefined,
          dueDate: dueDate || undefined,
          penaltyAmount: penaltyAmount ? parseFloat(penaltyAmount) : undefined,
          penaltyPer: penaltyPer || undefined,
          penaltyFormula: penaltyFormula.trim() || undefined,
          penaltyCap: penaltyCap ? parseFloat(penaltyCap) : undefined,
          penaltyCapUnit: penaltyCapUnit || undefined,
          escalation: escalation.trim() || undefined,
          condition: condition.trim() || undefined,
          penaltyDetails: penaltyDetails.trim() || undefined,
          recurrenceType: recurrenceType || undefined,
          recurrenceDay: recurrenceDay ? parseInt(recurrenceDay) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      toast.success("Point de suivi créé avec succès");
      router.push("/contraintes");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création"
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
          Nouveau point de suivi
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations principales</CardTitle>
            <CardDescription>Renseignez les informations essentielles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                placeholder="Ex: Pénalité de retard livrables documentaires"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez une catégorie">
                    {category
                      ? CONSTRAINT_CATEGORIES.find((c) => c.value === category)?.label
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CONSTRAINT_CATEGORY_GROUPS.map((group) => (
                    <SelectGroup key={group}>
                      <SelectLabel>{group}</SelectLabel>
                      {CONSTRAINT_CATEGORIES
                        .filter((c) => c.group === group)
                        .map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez la contrainte ou clause en détail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="penaltyAmount">Montant pénalité (€)</Label>
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
                <Label htmlFor="penaltyPer">Mode de calcul</Label>
                <Select value={penaltyPer} onValueChange={(v) => v && setPenaltyPer(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez">
                      {penaltyPer
                        ? PENALTY_PER.find((p) => p.value === penaltyPer)?.label
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PENALTY_PER.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="responsible">Responsable</Label>
                <Input
                  id="responsible"
                  placeholder="Nom du responsable ou entreprise"
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
          </CardContent>
        </Card>

        {/* Toggle pour options avancées */}
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 mr-2" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-2" />
          )}
          {showAdvanced ? "Masquer les options avancées" : "Plus d'options (référence, formule, plafond, conditions...)"}
        </Button>

        {/* Options avancées */}
        {showAdvanced && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Options avancées</CardTitle>
              <CardDescription>Référence contractuelle, formule de calcul, plafond et conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="articleRef">Référence article / clause</Label>
                  <Input
                    id="articleRef"
                    placeholder="Ex: Art. 10.3.1.2"
                    value={articleRef}
                    onChange={(e) => setArticleRef(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceDocument">Document source</Label>
                  <Input
                    id="sourceDocument"
                    placeholder="Ex: CCAP, Annexe technique"
                    value={sourceDocument}
                    onChange={(e) => setSourceDocument(e.target.value)}
                    maxLength={200}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="penaltyFormula">Formule de calcul</Label>
                <Input
                  id="penaltyFormula"
                  placeholder="Ex: 1/500ème du montant global et forfaitaire HT"
                  value={penaltyFormula}
                  onChange={(e) => setPenaltyFormula(e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  Pour les pénalités proportionnelles ou avec une formule spécifique
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="penaltyCap">Plafond</Label>
                  <Input
                    id="penaltyCap"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={penaltyCap}
                    onChange={(e) => setPenaltyCap(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penaltyCapUnit">Type de plafond</Label>
                  <Select value={penaltyCapUnit} onValueChange={(v) => v && setPenaltyCapUnit(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionnez">
                        {penaltyCapUnit
                          ? PENALTY_CAP_UNITS.find((u) => u.value === penaltyCapUnit)?.label
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PENALTY_CAP_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="condition">Condition de déclenchement</Label>
                <Textarea
                  id="condition"
                  placeholder="Ex: En cas de retard de plus de 30 minutes en réunion de chantier"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="escalation">Escalade / Récidive</Label>
                <Textarea
                  id="escalation"
                  placeholder="Ex: 1 500€ première infraction, 3 000€ à partir de la deuxième"
                  value={escalation}
                  onChange={(e) => setEscalation(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="penaltyDetails">Détails complémentaires</Label>
                <Textarea
                  id="penaltyDetails"
                  placeholder="Toute information complémentaire sur la pénalité..."
                  value={penaltyDetails}
                  onChange={(e) => setPenaltyDetails(e.target.value)}
                  rows={2}
                />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recurrenceType">Récurrence</Label>
                  <Select value={recurrenceType} onValueChange={(v) => v && setRecurrenceType(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Ponctuelle (par défaut)">
                        {recurrenceType
                          ? RECURRENCE_TYPES.find((r) => r.value === recurrenceType)?.label
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_TYPES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Pour les obligations périodiques (ex: bulletin météo toutes les 2 semaines)
                  </p>
                </div>

                {recurrenceType && recurrenceType !== "ponctuelle" && (
                  <div className="space-y-2">
                    <Label htmlFor="recurrenceDay">Jour de récurrence</Label>
                    <Input
                      id="recurrenceDay"
                      type="number"
                      placeholder={recurrenceType === "hebdomadaire" ? "1-7 (1=lundi)" : "1-31"}
                      min="1"
                      max={recurrenceType === "hebdomadaire" ? "7" : "31"}
                      value={recurrenceDay}
                      onChange={(e) => setRecurrenceDay(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {recurrenceType === "hebdomadaire"
                        ? "1=Lundi, 2=Mardi, ..., 7=Dimanche"
                        : "Jour du mois (1-31)"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            )}
            Créer le point de suivi
          </Button>
          <Link href="/contraintes">
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
