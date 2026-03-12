"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings,
  Building2,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  User,
  Phone,
  Mail,
  X,
  Upload,
  Image,
  Palette,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────
interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  address: string | null;
}

interface Contact {
  name: string;
  phone: string;
  email: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
  lotNumber: string | null;
  lotLabel: string | null;
  contacts: string;
  sortOrder: number;
}

interface ColumnWidths {
  attendance?: {
    designation?: string;
    societe?: string;
    nom?: string;
    presence?: string;
    convocation?: string;
  };
  observations?: {
    description?: string;
    pourLe?: string;
    faitLe?: string;
  };
}

interface PdfSettings {
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  headerColor?: string;
  showCoverPage?: boolean;
  coverTitle?: string;
  coverSubtitle?: string;
  footerText?: string;
  sitePhotoUrl?: string;
  siteAddress?: string;
  projectDescription?: string;
  columnWidths?: ColumnWidths;
}

// ─── Tabs ───────────────────────────────────────────────────────────
const TABS = [
  { id: "projet", label: "Projet", icon: Settings },
  { id: "annuaire", label: "Annuaire entreprises", icon: Building2 },
  { id: "pdf", label: "Mise en page PDF", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState<TabId>("projet");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configuration du projet de chantier"
      />

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "projet" && <ProjectSettingsTab />}
      {activeTab === "annuaire" && <CompanyDirectoryTab />}
      {activeTab === "pdf" && <PdfSettingsTab />}
    </div>
  );
}

// ─── Project Settings Tab ───────────────────────────────────────────
function ProjectSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [savingCode, setSavingCode] = useState(false);

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
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeAccessCode(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCode.trim()) {
      toast.error("Veuillez entrer le code actuel");
      return;
    }
    if (newCode.trim().length < 4) {
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
        throw new Error(data.error || "Erreur lors du changement");
      }
      toast.success("Code d'accès modifié");
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
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
          <h2 className="text-lg font-semibold mb-4">
            Code d&apos;accès du projet
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Partagez ce code avec votre équipe pour qu&apos;ils puissent
            rejoindre le projet.
          </p>
          <form onSubmit={handleChangeAccessCode} className="space-y-4">
            <div>
              <Label htmlFor="currentCode" className="mb-2 block">
                Code actuel
              </Label>
              <Input
                id="currentCode"
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                placeholder="Entrez le code actuel"
              />
            </div>
            <div>
              <Label htmlFor="newCode" className="mb-2 block">
                Nouveau code
              </Label>
              <Input
                id="newCode"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Nouveau code (min. 4 caractères)"
              />
            </div>
            <Button type="submit" disabled={savingCode} variant="outline">
              {savingCode ? "Modification..." : "Changer le code"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── PDF Settings Tab ────────────────────────────────────────────────
function PdfSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PdfSettings>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/pdf");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSettings(data);
      } catch {
        toast.error("Impossible de charger les paramètres PDF");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/pdf", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success("Paramètres PDF sauvegardés");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      toast.error("Le logo doit faire moins de 500 Ko");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSettings((prev) => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logo
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Le logo apparaîtra en haut du compte-rendu PDF et sur la page de couverture.
          </p>
          <div className="flex items-center gap-4">
            {settings.logoUrl ? (
              <div className="relative group">
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="h-20 max-w-[200px] object-contain border rounded p-2"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    setSettings((prev) => {
                      const next = { ...prev };
                      delete next.logoUrl;
                      return next;
                    })
                  }
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-48 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">
                  Charger un logo
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  PNG, JPG — max 500 Ko
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* En-tête et couleurs */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5" />
            En-tête et couleurs
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm">
                Nom de l&apos;entreprise / Maîtrise d&apos;œuvre
              </Label>
              <Input
                value={settings.companyName ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, companyName: e.target.value }))
                }
                placeholder="Ex: Cabinet d'architecture XYZ"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Affiché sur la page de couverture et en pied de page
              </p>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">
                Adresse de l&apos;entreprise
              </Label>
              <Textarea
                value={settings.companyAddress ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, companyAddress: e.target.value }))
                }
                placeholder="Ex: 12 rue de la Paix&#10;75001 Paris&#10;Tél: 01 23 45 67 89"
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Affiché sous le logo sur la page de couverture
              </p>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">
                Couleur de l&apos;en-tête
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.headerColor ?? "#1e3a5f"}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, headerColor: e.target.value }))
                  }
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={settings.headerColor ?? "#1e3a5f"}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, headerColor: e.target.value }))
                  }
                  className="w-32"
                  placeholder="#1e3a5f"
                />
                <div
                  className="h-10 flex-1 rounded border flex items-center px-3 font-bold"
                  style={{ color: settings.headerColor ?? "#1e3a5f" }}
                >
                  Aperçu du titre
                </div>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Texte de pied de page</Label>
              <Input
                value={settings.footerText ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, footerText: e.target.value }))
                }
                placeholder="Par défaut: CR n°X — Nom du projet"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page de couverture */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Page de couverture
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showCoverPage ?? false}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    showCoverPage: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <span className="text-sm">
                Afficher une page de couverture avant le contenu
              </span>
            </label>

            {settings.showCoverPage && (
              <div className="space-y-3 pl-7">
                <div>
                  <Label className="mb-1.5 block text-sm">
                    Titre de la couverture
                  </Label>
                  <Input
                    value={settings.coverTitle ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        coverTitle: e.target.value,
                      }))
                    }
                    placeholder="Compte-rendu de réunion de chantier"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">Sous-titre</Label>
                  <Input
                    value={settings.coverSubtitle ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        coverSubtitle: e.target.value,
                      }))
                    }
                    placeholder="Ex: Phase DCE — Suivi hebdomadaire"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">
                    Description du projet
                  </Label>
                  <Textarea
                    value={settings.projectDescription ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        projectDescription: e.target.value,
                      }))
                    }
                    placeholder="Ex: Construction d'un bâtiment de 20 logements collectifs"
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">
                    Adresse du chantier
                  </Label>
                  <Input
                    value={settings.siteAddress ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        siteAddress: e.target.value,
                      }))
                    }
                    placeholder="Ex: 45 avenue Victor Hugo, 33000 Bordeaux"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">
                    Photo du chantier
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Image affichée sur la page de couverture (max 1 Mo)
                  </p>
                  <div className="flex items-center gap-4">
                    {settings.sitePhotoUrl ? (
                      <div className="relative group">
                        <img
                          src={settings.sitePhotoUrl}
                          alt="Photo du chantier"
                          className="h-32 max-w-[300px] object-cover border rounded"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() =>
                            setSettings((prev) => {
                              const next = { ...prev };
                              delete next.sitePhotoUrl;
                              return next;
                            })
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-64 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">
                          Charger une photo
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                          PNG, JPG — max 1 Mo
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 1_000_000) {
                              toast.error("La photo doit faire moins de 1 Mo");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              setSettings((prev) => ({
                                ...prev,
                                sitePhotoUrl: reader.result as string,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Largeurs des colonnes */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Largeurs des colonnes
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Personnalisez les largeurs des colonnes du tableau de présence et des observations. Utilisez des pourcentages (ex: 25%) ou des valeurs fixes (ex: 80px).
          </p>

          {/* Attendance columns */}
          <h3 className="text-sm font-semibold mb-2 mt-4">Tableau de présence</h3>
          <div className="grid grid-cols-5 gap-2">
            {[
              { key: "designation" as const, label: "Désignation", def: "22%" },
              { key: "societe" as const, label: "Société", def: "20%" },
              { key: "nom" as const, label: "Nom", def: "28%" },
              { key: "presence" as const, label: "Présence", def: "15%" },
              { key: "convocation" as const, label: "Convocation", def: "15%" },
            ].map(({ key, label, def }) => (
              <div key={key}>
                <Label className="text-xs mb-1 block">{label}</Label>
                <Input
                  value={settings.columnWidths?.attendance?.[key] ?? def}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      columnWidths: {
                        ...prev.columnWidths,
                        attendance: {
                          ...prev.columnWidths?.attendance,
                          [key]: e.target.value,
                        },
                      },
                    }))
                  }
                  className="h-8 text-xs"
                  placeholder={def}
                />
              </div>
            ))}
          </div>

          {/* Observation columns */}
          <h3 className="text-sm font-semibold mb-2 mt-4">Tableau d&apos;observations</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "description" as const, label: "Description", def: "60%" },
              { key: "pourLe" as const, label: "Pour le", def: "20%" },
              { key: "faitLe" as const, label: "Fait le", def: "20%" },
            ].map(({ key, label, def }) => (
              <div key={key}>
                <Label className="text-xs mb-1 block">{label}</Label>
                <Input
                  value={settings.columnWidths?.observations?.[key] ?? def}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      columnWidths: {
                        ...prev.columnWidths,
                        observations: {
                          ...prev.columnWidths?.observations,
                          [key]: e.target.value,
                        },
                      },
                    }))
                  }
                  className="h-8 text-xs"
                  placeholder={def}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Sauvegarder les paramètres PDF
        </Button>
      </div>
    </div>
  );
}

// ─── Company Directory Tab ──────────────────────────────────────────
function CompanyDirectoryTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/companies");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompanies(data);
    } catch {
      toast.error("Erreur lors du chargement des entreprises");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  function handleSaved() {
    setShowForm(false);
    setEditingId(null);
    fetchCompanies();
  }

  async function handleDelete(company: Company) {
    if (!confirm(`Supprimer l'entreprise "${company.name}" ?`)) return;
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Entreprise supprimée");
      fetchCompanies();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configurez les entreprises intervenant sur le chantier. Elles seront
          utilisées dans les comptes-rendus de réunion.
        </p>
        {!showForm && !editingId && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <CompanyForm onSave={handleSaved} onCancel={() => setShowForm(false)} />
      )}

      {/* Company list */}
      {companies.length === 0 && !showForm ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucune entreprise enregistrée
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une entreprise
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {companies.map((company) =>
            editingId === company.id ? (
              <CompanyForm
                key={company.id}
                company={company}
                onSave={handleSaved}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <CompanyCard
                key={company.id}
                company={company}
                onEdit={() => setEditingId(company.id)}
                onDelete={() => handleDelete(company)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Company Card ───────────────────────────────────────────────────
function CompanyCard({
  company,
  onEdit,
  onDelete,
}: {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const contacts: Contact[] = (() => {
    try {
      return JSON.parse(company.contacts || "[]");
    } catch {
      return [];
    }
  })();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <GripVertical className="h-5 w-5 text-muted-foreground/30 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{company.name}</span>
              {company.lotNumber && (
                <Badge variant="secondary" className="text-xs">
                  Lot {company.lotNumber}
                  {company.lotLabel ? ` — ${company.lotLabel}` : ""}
                </Badge>
              )}
            </div>
            {contacts.length > 0 && (
              <div className="mt-2 space-y-1">
                {contacts.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-xs text-muted-foreground"
                  >
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {c.name}
                      {c.role && (
                        <span className="text-muted-foreground/60">
                          ({c.role})
                        </span>
                      )}
                    </span>
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {c.email}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Company Form ───────────────────────────────────────────────────
function CompanyForm({
  company,
  onSave,
  onCancel,
}: {
  company?: Company;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(company?.name ?? "");
  const [lotNumber, setLotNumber] = useState(company?.lotNumber ?? "");
  const [lotLabel, setLotLabel] = useState(company?.lotLabel ?? "");
  const [contacts, setContacts] = useState<Contact[]>(() => {
    if (!company?.contacts) return [];
    try {
      return JSON.parse(company.contacts);
    } catch {
      return [];
    }
  });

  function addContact() {
    setContacts((prev) => [...prev, { name: "", phone: "", email: "", role: "" }]);
  }

  function removeContact(index: number) {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateContact(index: number, field: keyof Contact, value: string) {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom de l'entreprise est requis");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        lotNumber: lotNumber.trim() || null,
        lotLabel: lotLabel.trim() || null,
        contacts: JSON.stringify(contacts.filter((c) => c.name.trim())),
        sortOrder: company?.sortOrder ?? 0,
      };

      const url = company ? `/api/companies/${company.id}` : "/api/companies";
      const method = company ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      toast.success(company ? "Entreprise modifiée" : "Entreprise ajoutée");
      onSave();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Label className="mb-1.5 block text-xs">
                Nom de l&apos;entreprise *
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: EIFFAGE"
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">N° de lot</Label>
              <Input
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="Ex: 01"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Intitulé du lot</Label>
              <Input
                value={lotLabel}
                onChange={(e) => setLotLabel(e.target.value)}
                placeholder="Ex: Gros œuvre"
              />
            </div>
          </div>

          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Contacts</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={addContact}
              >
                <Plus className="h-3 w-3 mr-1" />
                Contact
              </Button>
            </div>
            {contacts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun contact — cliquez sur &quot;+ Contact&quot; pour ajouter
              </p>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="grid gap-2 sm:grid-cols-4 flex-1">
                      <Input
                        placeholder="Nom"
                        value={contact.name}
                        onChange={(e) => updateContact(i, "name", e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Fonction"
                        value={contact.role}
                        onChange={(e) => updateContact(i, "role", e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Téléphone"
                        value={contact.phone}
                        onChange={(e) => updateContact(i, "phone", e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateContact(i, "email", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500"
                      onClick={() => removeContact(i)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {company ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
