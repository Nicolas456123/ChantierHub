"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Calculator, Loader2, CalendarCheck } from "lucide-react";

interface PenaltyCalculatorProps {
  constraintId: string;
  penaltyAmount: number | null;
  penaltyPer: string | null;
  penaltyCap: number | null;
  penaltyCapUnit: string | null;
  occurrences: number;
  dueDate: string | null;
  penaltyStartDate: string | null;
  resolvedDate: string | null;
}

function countWeekdays(start: Date, end: Date): number {
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function countCalendarDays(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function PenaltyCalculator({
  constraintId,
  penaltyAmount,
  penaltyPer,
  penaltyCap,
  penaltyCapUnit,
  occurrences: initialOccurrences,
  dueDate,
  penaltyStartDate,
  resolvedDate: initialResolvedDate,
}: PenaltyCalculatorProps) {
  const router = useRouter();
  const [occurrences, setOccurrences] = useState(initialOccurrences);
  const [resolvedDate, setResolvedDate] = useState(
    initialResolvedDate ? initialResolvedDate.split("T")[0] : ""
  );
  const [saving, setSaving] = useState(false);

  if (!penaltyAmount) return null;

  const isForfaitaire = penaltyPer === "forfaitaire";
  const isProportionnel = penaltyPer === "proportionnel";
  const isPerDay = penaltyPer === "par_jour" || penaltyPer === "par_jour_ouvrable";

  // Auto-compute days for per-day modes
  const autoComputedDays = useMemo(() => {
    if (!isPerDay) return null;
    const startStr = penaltyStartDate || dueDate;
    if (!startStr) return null;

    const start = new Date(startStr);
    const end = resolvedDate ? new Date(resolvedDate) : new Date();

    if (end < start) return 0;

    if (penaltyPer === "par_jour_ouvrable") {
      return countWeekdays(start, end);
    }
    return countCalendarDays(start, end);
  }, [isPerDay, penaltyStartDate, dueDate, resolvedDate, penaltyPer]);

  // Calculate total
  const effectiveCount = isPerDay ? (autoComputedDays ?? 0) : occurrences;
  let total = penaltyAmount * effectiveCount;
  let capped = false;

  if (penaltyCap) {
    if (penaltyCapUnit === "montant_fixe" && total > penaltyCap) {
      total = penaltyCap;
      capped = true;
    } else if (penaltyCapUnit === "par_unite" && penaltyAmount > penaltyCap) {
      total = penaltyCap * effectiveCount;
      capped = true;
    }
  }

  async function saveOccurrences(newValue: number) {
    const value = Math.max(0, newValue);
    setOccurrences(value);
    setSaving(true);
    try {
      const res = await fetch(`/api/constraints/${constraintId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occurrences: value }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function saveResolvedDate(dateStr: string) {
    setResolvedDate(dateStr);
    setSaving(true);
    try {
      const res = await fetch(`/api/constraints/${constraintId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolvedDate: dateStr || null }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  const startDateStr = penaltyStartDate
    ? new Date(penaltyStartDate).toLocaleDateString("fr-FR")
    : dueDate
    ? new Date(dueDate).toLocaleDateString("fr-FR")
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Calcul pénalité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Per-day mode: date de levée */}
        {isPerDay && (
          <div className="space-y-3">
            {startDateStr && (
              <div className="text-xs text-muted-foreground">
                Début : <span className="font-medium text-foreground">{startDateStr}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarCheck className="h-3 w-3" />
                Date de levée
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={resolvedDate}
                  onChange={(e) => saveResolvedDate(e.target.value)}
                  className="h-8"
                />
                {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {!resolvedDate && (
                <p className="text-xs text-orange-600">
                  En cours — calcul jusqu&apos;à aujourd&apos;hui
                </p>
              )}
            </div>
          </div>
        )}

        {/* Manual counter for non-day modes */}
        {!isForfaitaire && !isPerDay && !isProportionnel && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Nombre constaté
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => saveOccurrences(occurrences - 1)}
                disabled={occurrences <= 0 || saving}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                min="0"
                value={occurrences}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  setOccurrences(v);
                }}
                onBlur={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  saveOccurrences(v);
                }}
                className="h-8 text-center w-20"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => saveOccurrences(occurrences + 1)}
                disabled={saving}
              >
                <Plus className="h-3 w-3" />
              </Button>
              {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
        )}

        {/* Calculation display */}
        {!isProportionnel && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant unitaire</span>
              <span>{penaltyAmount.toLocaleString("fr-FR")} €</span>
            </div>
            {isPerDay && autoComputedDays !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  × {penaltyPer === "par_jour_ouvrable" ? "Jours ouvrés" : "Jours"}
                </span>
                <span className="font-medium">
                  {autoComputedDays}
                  {!resolvedDate && (
                    <span className="text-orange-600 text-xs ml-1">(en cours)</span>
                  )}
                </span>
              </div>
            )}
            {!isForfaitaire && !isPerDay && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">× Occurrences</span>
                <span>{occurrences}</span>
              </div>
            )}
            {capped && (
              <div className="flex justify-between text-xs text-orange-600">
                <span>Plafond appliqué</span>
                <span>{penaltyCap?.toLocaleString("fr-FR")} €</span>
              </div>
            )}
            <div className="border-t pt-1 mt-1 flex justify-between font-semibold">
              <span>Total estimé</span>
              <span className={`text-lg ${total > 0 ? "text-orange-600" : ""}`}>
                {(isForfaitaire ? penaltyAmount : total).toLocaleString("fr-FR")} €
              </span>
            </div>
          </div>
        )}

        {isProportionnel && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-muted-foreground">
            Calcul proportionnel — voir la formule ci-dessus
          </div>
        )}

        {capped && (
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
            Plafond atteint
          </Badge>
        )}

        {isPerDay && resolvedDate && (
          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
            Levée le {new Date(resolvedDate).toLocaleDateString("fr-FR")}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
