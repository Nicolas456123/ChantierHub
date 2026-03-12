"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Calculator, Loader2 } from "lucide-react";

interface PenaltyCalculatorProps {
  constraintId: string;
  penaltyAmount: number | null;
  penaltyPer: string | null;
  penaltyCap: number | null;
  penaltyCapUnit: string | null;
  occurrences: number;
}

export function PenaltyCalculator({
  constraintId,
  penaltyAmount,
  penaltyPer,
  penaltyCap,
  penaltyCapUnit,
  occurrences: initialOccurrences,
}: PenaltyCalculatorProps) {
  const router = useRouter();
  const [occurrences, setOccurrences] = useState(initialOccurrences);
  const [saving, setSaving] = useState(false);

  if (!penaltyAmount) return null;

  // Calculate total
  let total = penaltyAmount * occurrences;
  let capped = false;

  if (penaltyCap) {
    if (penaltyCapUnit === "montant_fixe" && total > penaltyCap) {
      total = penaltyCap;
      capped = true;
    } else if (penaltyCapUnit === "par_unite" && penaltyAmount > penaltyCap) {
      total = penaltyCap * occurrences;
      capped = true;
    }
  }

  const isForfaitaire = penaltyPer === "forfaitaire";

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Calcul pénalité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isForfaitaire && (
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
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Montant unitaire</span>
            <span>{penaltyAmount.toLocaleString("fr-FR")} €</span>
          </div>
          {!isForfaitaire && (
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

        {capped && (
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
            Plafond atteint
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
