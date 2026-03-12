"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NouveauCompteRenduPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState("");
  const [nextMeetingDate, setNextMeetingDate] = useState("");
  const [nextMeetingTime, setNextMeetingTime] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) {
      toast.error("La date est requise");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/meeting-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          location: location.trim() || null,
          weather: weather.trim() || null,
          nextMeetingDate: nextMeetingDate || null,
          nextMeetingTime: nextMeetingTime.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      const report = await res.json();
      toast.success(`Compte-rendu n°${report.number} créé`);
      router.push(`/comptes-rendus/${report.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau compte-rendu"
        description="Créer un nouveau compte-rendu de réunion de chantier"
        action={
          <Link href="/comptes-rendus">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="date" className="mb-2 block">
                  Date de la réunion *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="location" className="mb-2 block">
                  Lieu
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Bureau de chantier"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="weather" className="mb-2 block">
                Météo
              </Label>
              <Input
                id="weather"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                placeholder="Ex: Ensoleillé, 15°C"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="nextMeetingDate" className="mb-2 block">
                  Prochaine réunion
                </Label>
                <Input
                  id="nextMeetingDate"
                  type="date"
                  value={nextMeetingDate}
                  onChange={(e) => setNextMeetingDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nextMeetingTime" className="mb-2 block">
                  Heure
                </Label>
                <Input
                  id="nextMeetingTime"
                  type="time"
                  value={nextMeetingTime}
                  onChange={(e) => setNextMeetingTime(e.target.value)}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Les observations en cours du dernier compte-rendu seront
              automatiquement reportées. La liste de présence sera pré-remplie
              depuis l&apos;annuaire.
            </p>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                )}
                Créer le compte-rendu
              </Button>
              <Link href="/comptes-rendus">
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
