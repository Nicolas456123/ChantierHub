"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  accessCode: string;
  startDate: string | null;
  endDate: string | null;
  address: string | null;
}

export default function ParametresPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCode, setSavingCode] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Erreur réseau");
        const project: Project = await res.json();

        setName(project.name);
        setDescription(project.description ?? "");
        setAddress(project.address ?? "");
        setStartDate(
          project.startDate
            ? new Date(project.startDate).toISOString().split("T")[0]
            : ""
        );
        setEndDate(
          project.endDate
            ? new Date(project.endDate).toISOString().split("T")[0]
            : ""
        );
      } catch {
        toast.error("Impossible de charger les paramètres");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      toast.success("Paramètres sauvegardés");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la sauvegarde"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeCode(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCode.trim()) {
      toast.error("Le code actuel est requis");
      return;
    }
    if (newCode.length < 4) {
      toast.error("Le nouveau code doit contenir au moins 4 caractères");
      return;
    }

    setSavingCode(true);
    try {
      const res = await fetch("/api/settings/access-code", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCode: currentCode.trim(),
          newCode: newCode.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors du changement du code");
      }

      toast.success("Code d'accès modifié avec succès");
      setCurrentCode("");
      setNewCode("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors du changement du code"
      );
    } finally {
      setSavingCode(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Paramètres" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configuration du projet de chantier"
      />

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Informations du projet
          </h2>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-2 block">
                Nom du projet
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du projet"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du projet"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="address" className="mb-2 block">
                Adresse
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse du chantier"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="startDate" className="mb-2 block">
                  Date de début
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate" className="mb-2 block">
                  Date de fin
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Code d&apos;accès</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Modifiez le code d&apos;accès utilisé pour se connecter au chantier.
          </p>
          <Separator className="mb-4" />
          <form onSubmit={handleChangeCode} className="space-y-4">
            <div>
              <Label htmlFor="currentCode" className="mb-2 block">
                Code actuel
              </Label>
              <Input
                id="currentCode"
                type="password"
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                placeholder="Entrez le code actuel"
                required
              />
            </div>

            <div>
              <Label htmlFor="newCode" className="mb-2 block">
                Nouveau code
              </Label>
              <Input
                id="newCode"
                type="password"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Entrez le nouveau code (min. 4 caractères)"
                required
                minLength={4}
              />
            </div>

            <Button type="submit" disabled={savingCode}>
              {savingCode ? "Modification..." : "Changer le code"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
