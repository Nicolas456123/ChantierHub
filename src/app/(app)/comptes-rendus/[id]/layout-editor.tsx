"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MeetingReportPreview } from "@/components/meeting-report-preview";
import { toast } from "sonner";
import {
  X,
  Download,
  Save,
  Upload,
  ChevronDown,
  ChevronRight,
  Palette,
  Image,
  FileText,
  Type,
  Table,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────
interface Company {
  id: string;
  name: string;
  lotNumber: string | null;
  lotLabel: string | null;
  contacts?: string;
}

interface Attendance {
  id: string;
  companyId: string;
  status: string;
  representant: string;
  company: Company;
}

interface Section {
  id: string;
  companyId: string | null;
  title: string;
  content: string;
  sortOrder: number;
  company: Company | null;
}

interface Observation {
  id: string;
  description: string;
  category: string | null;
  dueDate: string | null;
  doneDate: string | null;
  status: string;
  companyId: string | null;
  sectionId: string | null;
  sourceObservationId: string | null;
  createdAt: string;
}

interface MeetingReport {
  id: string;
  number: number;
  date: string;
  location: string | null;
  nextMeetingDate: string | null;
  nextMeetingTime: string | null;
  weather: string | null;
  generalNotes: string;
  status: string;
  author: string;
  attendances: Attendance[];
  sections: Section[];
  observations: Observation[];
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
  columnWidths?: {
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
  };
  fontFamily?: string;
  showContacts?: boolean;
  showConvocation?: boolean;
  visibleCategories?: string[];
}

interface LayoutEditorProps {
  report: MeetingReport;
  projectName: string;
  previousReportNumber: number | null;
  pdfSettings: PdfSettings;
  onClose: () => void;
  onSave: (settings: PdfSettings) => void;
}

// ─── Accordion Section ──────────────────────────────────────────────
function SettingsSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left">{title}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// ─── Layout Editor ──────────────────────────────────────────────────
export function LayoutEditor({
  report,
  projectName,
  previousReportNumber,
  pdfSettings: initialSettings,
  onClose,
  onSave,
}: LayoutEditorProps) {
  const [settings, setSettings] = useState<PdfSettings>({ ...initialSettings });
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState<number | "auto">("auto");
  const [autoScale, setAutoScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const A4_WIDTH_PX = 794; // 210mm ≈ 794px

  // Compute auto-fit scale from container size
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;
    const PADDING = 48;
    const compute = () => {
      const w = container.clientWidth - PADDING;
      setAutoScale(w < A4_WIDTH_PX ? Math.max(0.3, w / A4_WIDTH_PX) : 1);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const effectiveScale = zoom === "auto" ? autoScale : zoom / 100;

  const ZOOM_STEPS = [50, 75, 100, 125, 150];
  const zoomIn = useCallback(() => {
    setZoom((prev) => {
      const current = prev === "auto" ? Math.round(autoScale * 100) : prev;
      const next = ZOOM_STEPS.find((s) => s > current);
      return next ?? current;
    });
  }, [autoScale]);
  const zoomOut = useCallback(() => {
    setZoom((prev) => {
      const current = prev === "auto" ? Math.round(autoScale * 100) : prev;
      const next = [...ZOOM_STEPS].reverse().find((s) => s < current);
      return next ?? current;
    });
  }, [autoScale]);
  const zoomLabel = zoom === "auto" ? `Auto (${Math.round(autoScale * 100)}%)` : `${zoom}%`;

  const update = useCallback(
    <K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleColumnResize = useCallback(
    (table: "attendance" | "observations", key: string, value: string) => {
      setSettings((prev) => ({
        ...prev,
        columnWidths: {
          ...prev.columnWidths,
          [table]: {
            ...prev.columnWidths?.[table],
            [key]: value,
          },
        },
      }));
    },
    []
  );

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/pdf", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      onSave(settings);
      toast.success("Mise en page sauvegard\u00e9e");
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
    reader.onload = () => update("logoUrl", reader.result as string);
    reader.readAsDataURL(file);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      toast.error("La photo doit faire moins de 1 Mo");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("sitePhotoUrl", reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex">
      <div className="flex flex-1 bg-background">
        {/* ─── Left Panel: Settings ─── */}
        <div className="w-[280px] lg:w-[340px] flex-shrink-0 border-r flex flex-col bg-background">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Mise en page</h3>
            <div className="flex items-center gap-1.5">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                Sauvegarder
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable settings */}
          <div className="flex-1 overflow-y-auto">
            {/* Logo & Enterprise */}
            <SettingsSection title="Logo & Entreprise" icon={Image} defaultOpen>
              <div>
                <Label className="text-xs">Logo</Label>
                <div className="mt-1 flex items-center gap-2">
                  {settings.logoUrl ? (
                    <div className="relative group">
                      <img src={settings.logoUrl} alt="Logo" className="h-10 max-w-[100px] object-contain border rounded p-1" />
                      <button
                        className="absolute -top-1 -right-1 bg-destructive text-white rounded-full h-4 w-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                        onClick={() => update("logoUrl", undefined)}
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-1 text-xs text-muted-foreground border border-dashed rounded px-3 py-2 cursor-pointer hover:bg-accent/50">
                      <Upload className="h-3.5 w-3.5" />
                      Charger
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs">Nom de l&apos;entreprise</Label>
                <Input
                  value={settings.companyName ?? ""}
                  onChange={(e) => update("companyName", e.target.value)}
                  placeholder="Cabinet XYZ"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Adresse</Label>
                <Textarea
                  value={settings.companyAddress ?? ""}
                  onChange={(e) => update("companyAddress", e.target.value)}
                  placeholder={"12 rue de la Paix\n75001 Paris"}
                  rows={2}
                  className="text-xs mt-1 resize-none"
                />
              </div>
            </SettingsSection>

            {/* Cover Page */}
            <SettingsSection title="Page de couverture" icon={FileText}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showCoverPage ?? false}
                  onChange={(e) => update("showCoverPage", e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs">Afficher la page de couverture</span>
              </label>
              {settings.showCoverPage && (
                <>
                  <div>
                    <Label className="text-xs">Titre</Label>
                    <Input
                      value={settings.coverTitle ?? ""}
                      onChange={(e) => update("coverTitle", e.target.value)}
                      placeholder="Compte-rendu"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Sous-titre</Label>
                    <Input
                      value={settings.coverSubtitle ?? ""}
                      onChange={(e) => update("coverSubtitle", e.target.value)}
                      placeholder="R\u00e9union de chantier"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Description du projet</Label>
                    <Textarea
                      value={settings.projectDescription ?? ""}
                      onChange={(e) => update("projectDescription", e.target.value)}
                      placeholder="Construction de..."
                      rows={2}
                      className="text-xs mt-1 resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Adresse du chantier</Label>
                    <Input
                      value={settings.siteAddress ?? ""}
                      onChange={(e) => update("siteAddress", e.target.value)}
                      placeholder="45 avenue Victor Hugo..."
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Photo du chantier</Label>
                    <div className="mt-1">
                      {settings.sitePhotoUrl ? (
                        <div className="relative group">
                          <img src={settings.sitePhotoUrl} alt="Chantier" className="h-20 max-w-full object-cover border rounded" />
                          <button
                            className="absolute -top-1 -right-1 bg-destructive text-white rounded-full h-4 w-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                            onClick={() => update("sitePhotoUrl", undefined)}
                          >
                            &times;
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-1 text-xs text-muted-foreground border border-dashed rounded px-3 py-2 cursor-pointer hover:bg-accent/50">
                          <Upload className="h-3.5 w-3.5" />
                          Charger (max 1 Mo)
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </label>
                      )}
                    </div>
                  </div>
                </>
              )}
            </SettingsSection>

            {/* Colors & Style */}
            <SettingsSection title="Couleurs & Style" icon={Palette}>
              <div>
                <Label className="text-xs">Couleur d&apos;accentuation</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={settings.headerColor ?? "#2563eb"}
                    onChange={(e) => update("headerColor", e.target.value)}
                    className="h-8 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings.headerColor ?? "#2563eb"}
                    onChange={(e) => update("headerColor", e.target.value)}
                    className="h-8 text-xs w-24"
                  />
                  <div className="h-8 flex-1 rounded border flex items-center justify-center text-xs font-bold" style={{ color: settings.headerColor ?? "#2563eb" }}>
                    Aper{"\u00e7"}u
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs">Police</Label>
                <select
                  value={settings.fontFamily ?? "Helvetica"}
                  onChange={(e) => update("fontFamily", e.target.value)}
                  className="w-full h-8 text-xs border rounded px-2 mt-1 bg-background"
                >
                  <option value="Helvetica">Helvetica (sans-serif)</option>
                  <option value="Times-Roman">Times (serif)</option>
                  <option value="Courier">Courier (monospace)</option>
                </select>
              </div>
            </SettingsSection>

            {/* Attendance Table */}
            <SettingsSection title="Tableau de pr\u00e9sence" icon={Table}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showContacts !== false}
                  onChange={(e) => update("showContacts", e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs">Afficher les contacts (t{"\u00e9"}l/email)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showConvocation !== false}
                  onChange={(e) => update("showConvocation", e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs">Afficher la colonne convocation</span>
              </label>
              <p className="text-[10px] text-muted-foreground italic">
                Glissez les bords des colonnes dans l&apos;aper{"\u00e7"}u pour ajuster les largeurs.
              </p>
            </SettingsSection>

            {/* Observations */}
            <SettingsSection title="Observations" icon={Type}>
              <p className="text-[10px] text-muted-foreground italic">
                Glissez les bords des colonnes dans l&apos;aper{"\u00e7"}u pour ajuster les largeurs.
              </p>
              <div>
                <Label className="text-xs mb-1.5 block">Cat{"\u00e9"}gories visibles</Label>
                <div className="space-y-1">
                  {[
                    { key: "administratif", label: "Administratif" },
                    { key: "etudes", label: "\u00c9tudes" },
                    { key: "controle", label: "Bureau de contr\u00f4le" },
                    { key: "avancement", label: "Avancement / Pr\u00e9visions" },
                    { key: "visite", label: "Visite de chantier" },
                  ].map(({ key, label }) => {
                    const visible = !settings.visibleCategories || settings.visibleCategories.includes(key);
                    return (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visible}
                          onChange={(e) => {
                            const all = ["administratif", "etudes", "controle", "avancement", "visite"];
                            const current = settings.visibleCategories ?? all;
                            const next = e.target.checked
                              ? [...current, key]
                              : current.filter((c) => c !== key);
                            update("visibleCategories", next);
                          }}
                          className="rounded"
                        />
                        <span className="text-xs">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </SettingsSection>

            {/* Footer */}
            <SettingsSection title="Pied de page" icon={FileText}>
              <div>
                <Label className="text-xs">Texte</Label>
                <Input
                  value={settings.footerText ?? ""}
                  onChange={(e) => update("footerText", e.target.value)}
                  placeholder="Par d\u00e9faut : nom de l'entreprise"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </SettingsSection>
          </div>
        </div>

        {/* ─── Right Panel: Live Preview ─── */}
        <div className="flex-1 flex flex-col">
          {/* Preview header */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Aper{"\u00e7"}u
            </span>
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-background border rounded-md px-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={zoomOut} title="Zoom -">
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <button
                onClick={() => setZoom("auto")}
                className="text-[11px] text-muted-foreground hover:text-foreground px-1.5 min-w-[70px] text-center"
                title="Ajuster automatiquement"
              >
                {zoomLabel}
              </button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={zoomIn} title="Zoom +">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/api/meeting-reports/${report.id}/pdf`, "_blank")}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              PDF
            </Button>
          </div>

          {/* Preview content */}
          <div ref={previewContainerRef} className="flex-1 overflow-auto bg-gray-200 p-6">
            <div
              className="mx-auto shadow-xl"
              style={{
                width: "210mm",
                transformOrigin: "top left",
                transform: effectiveScale !== 1 ? `scale(${effectiveScale})` : undefined,
              }}
            >
              <MeetingReportPreview
                report={report}
                projectName={projectName}
                previousReportNumber={previousReportNumber}
                pdfSettings={settings}
                onColumnResize={handleColumnResize}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
