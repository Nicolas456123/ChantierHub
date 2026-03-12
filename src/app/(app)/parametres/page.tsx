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
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  User,
  Phone,
  Mail,
  X,
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

// ─── Tabs ───────────────────────────────────────────────────────────
const TABS = [
  { id: "projet", label: "Projet", icon: Settings },
  { id: "annuaire", label: "Annuaire entreprises", icon: Building2 },
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
