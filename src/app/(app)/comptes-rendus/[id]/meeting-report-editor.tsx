"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "@/components/tiptap-editor";
import { CommentsSection } from "@/components/comments-section";
import { MeetingReportPreview } from "@/components/meeting-report-preview";
import {
  MEETING_REPORT_STATUSES,
  ATTENDANCE_STATUSES,
  OBSERVATION_STATUSES,
  OBSERVATION_CATEGORIES,
} from "@/lib/constants";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Cloud,
  Clock,
  Users,
  FileText,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Download,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  BookTemplate,
  Save,
  Star,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────
interface Company {
  id: string;
  name: string;
  lotNumber: string | null;
  lotLabel: string | null;
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

interface MeetingTemplate {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

interface PdfSettings {
  logoUrl?: string;
  companyName?: string;
  headerColor?: string;
  showCoverPage?: boolean;
  coverTitle?: string;
  coverSubtitle?: string;
  footerText?: string;
}

interface Props {
  report: MeetingReport;
  previousReportNumber: number | null;
  companies: Company[];
  projectName: string;
  pdfSettings: PdfSettings;
}

// ─── Main Editor ────────────────────────────────────────────────────
export function MeetingReportEditor({
  report: initialReport,
  previousReportNumber,
  companies,
  projectName,
  pdfSettings,
}: Props) {
  const router = useRouter();
  const [report, setReport] = useState(initialReport);
  const [attendances, setAttendances] = useState(initialReport.attendances);
  const [sections] = useState(initialReport.sections);
  const [observations, setObservations] = useState(initialReport.observations);
  const [saving, setSaving] = useState(false);
  const [generalNotes, setGeneralNotes] = useState(initialReport.generalNotes);
  const [showPreview, setShowPreview] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  // Templates
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDefault, setNewTemplateDefault] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Load templates on mount
  useEffect(() => {
    fetch("/api/meeting-templates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});
  }, []);

  // Header info editing
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerDate, setHeaderDate] = useState(
    report.date ? new Date(report.date).toISOString().split("T")[0] : ""
  );
  const [headerLocation, setHeaderLocation] = useState(
    report.location ?? ""
  );
  const [headerWeather, setHeaderWeather] = useState(report.weather ?? "");
  const [headerNextDate, setHeaderNextDate] = useState(
    report.nextMeetingDate
      ? new Date(report.nextMeetingDate).toISOString().split("T")[0]
      : ""
  );
  const [headerNextTime, setHeaderNextTime] = useState(
    report.nextMeetingTime ?? ""
  );

  const statusInfo = MEETING_REPORT_STATUSES.find(
    (s) => s.value === report.status
  );

  // Observation stats
  const obsStats = {
    total: observations.length,
    en_cours: observations.filter((o) => o.status === "en_cours").length,
    fait: observations.filter((o) => o.status === "fait").length,
    retard: observations.filter((o) => o.status === "retard").length,
    urgent: observations.filter((o) => o.status === "urgent").length,
  };

  // ─── Template actions ────────────────────────────────────────────
  function applyTemplate(template: MeetingTemplate) {
    setGeneralNotes(template.content);
    setEditorKey((k) => k + 1); // Force TiptapEditor remount
    setShowTemplateMenu(false);
    saveGeneralNotes(template.content);
    toast.success(`Modèle "${template.name}" appliqué`);
  }

  async function saveAsTemplate() {
    if (!newTemplateName.trim()) return;
    setSavingTemplate(true);
    try {
      const res = await fetch("/api/meeting-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          content: generalNotes,
          isDefault: newTemplateDefault,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setTemplates((prev) => {
        const updated = newTemplateDefault
          ? prev.map((t) => ({ ...t, isDefault: false }))
          : [...prev];
        if (newTemplateDefault) {
          return [created, ...updated];
        }
        return [...updated, created];
      });
      setNewTemplateName("");
      setNewTemplateDefault(false);
      setShowSaveTemplate(false);
      toast.success("Modèle sauvegardé");
    } catch {
      toast.error("Erreur lors de la sauvegarde du modèle");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function deleteTemplate(templateId: string) {
    try {
      await fetch(`/api/meeting-templates/${templateId}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      toast.success("Modèle supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  // ─── Save header ─────────────────────────────────────────────────
  async function saveHeader() {
    setSaving(true);
    try {
      const res = await fetch(`/api/meeting-reports/${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: headerDate,
          location: headerLocation.trim() || null,
          weather: headerWeather.trim() || null,
          nextMeetingDate: headerNextDate || null,
          nextMeetingTime: headerNextTime.trim() || null,
          generalNotes: report.generalNotes,
          status: report.status,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setReport((prev) => ({ ...prev, ...updated }));
      setEditingHeader(false);
      toast.success("En-tête sauvegardé");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  // ─── Save general notes (auto-saved via Tiptap debounce) ────────
  const saveGeneralNotes = useCallback(
    async (json: string) => {
      setGeneralNotes(json);
      try {
        await fetch(`/api/meeting-reports/${report.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generalNotes: json }),
        });
      } catch {
        toast.error("Erreur lors de la sauvegarde des notes");
      }
    },
    [report.id]
  );

  // ─── Save attendances ────────────────────────────────────────────
  const saveAttendances = useCallback(
    async (updated: Attendance[]) => {
      try {
        await fetch(`/api/meeting-reports/${report.id}/attendances`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendances: updated.map((a) => ({
              companyId: a.companyId,
              status: a.status,
              representant: a.representant,
            })),
          }),
        });
      } catch {
        toast.error("Erreur lors de la sauvegarde des présences");
      }
    },
    [report.id]
  );

  function toggleAttendance(companyId: string, newStatus: string) {
    setAttendances((prev) => {
      const updated = prev.map((a) =>
        a.companyId === companyId ? { ...a, status: newStatus } : a
      );
      saveAttendances(updated);
      return updated;
    });
  }

  function updateRepresentant(companyId: string, value: string) {
    setAttendances((prev) =>
      prev.map((a) =>
        a.companyId === companyId ? { ...a, representant: value } : a
      )
    );
  }

  function saveRepresentant() {
    saveAttendances(attendances);
  }

  // ─── Save section content ────────────────────────────────────────
  async function saveSectionContent(sectionId: string, content: string) {
    try {
      await fetch(
        `/api/meeting-reports/${report.id}/sections/${sectionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  }

  // ─── Change status ───────────────────────────────────────────────
  async function changeStatus(newStatus: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/meeting-reports/${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setReport((prev) => ({ ...prev, status: newStatus }));
      toast.success("Statut mis à jour");
    } catch {
      toast.error("Erreur lors du changement de statut");
    } finally {
      setSaving(false);
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirm("Supprimer ce compte-rendu ? Cette action est irréversible."))
      return;
    try {
      const res = await fetch(`/api/meeting-reports/${report.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Compte-rendu supprimé");
      router.push("/comptes-rendus");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  // ─── Preview ───────────────────────────────────────────────────────
  function openPreview() {
    setShowPreview(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Compte-rendu n°${report.number}`}
        description={new Date(report.date).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={openPreview}>
              <Eye className="h-4 w-4 mr-1" />
              Aperçu
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.open(
                  `/api/meeting-reports/${report.id}/pdf`,
                  "_blank"
                );
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Télécharger
            </Button>
            {report.status === "brouillon" && (
              <Button
                size="sm"
                onClick={() => changeStatus("valide")}
                disabled={saving}
              >
                Valider
              </Button>
            )}
            {report.status === "valide" && (
              <Button
                size="sm"
                onClick={() => changeStatus("diffuse")}
                disabled={saving}
              >
                Diffuser
              </Button>
            )}
            <Link href="/comptes-rendus">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour
              </Button>
            </Link>
          </div>
        }
      />

      {/* HTML Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-background rounded-t-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Aperçu — CR n°{report.number}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.open(
                      `/api/meeting-reports/${report.id}/pdf`,
                      "_blank"
                    );
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exporter PDF
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-200 p-6">
              <div className="mx-auto shadow-xl" style={{ maxWidth: "210mm" }}>
                <MeetingReportPreview
                  report={{
                    ...report,
                    generalNotes: generalNotes,
                    attendances,
                    sections: sections,
                    observations,
                  }}
                  projectName={projectName}
                  previousReportNumber={previousReportNumber}
                  pdfSettings={pdfSettings}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content: 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Informations</CardTitle>
                <div className="flex items-center gap-2">
                  {statusInfo && (
                    <Badge variant="secondary" className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                  )}
                  {!editingHeader && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingHeader(true)}
                    >
                      Modifier
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingHeader ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs mb-1 block">Date</Label>
                      <Input
                        type="date"
                        value={headerDate}
                        onChange={(e) => setHeaderDate(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Lieu</Label>
                      <Input
                        value={headerLocation}
                        onChange={(e) => setHeaderLocation(e.target.value)}
                        className="h-8"
                        placeholder="Bureau de chantier"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Météo</Label>
                    <Input
                      value={headerWeather}
                      onChange={(e) => setHeaderWeather(e.target.value)}
                      className="h-8"
                      placeholder="Ensoleillé, 15°C"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs mb-1 block">
                        Prochaine réunion
                      </Label>
                      <Input
                        type="date"
                        value={headerNextDate}
                        onChange={(e) => setHeaderNextDate(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Heure</Label>
                      <Input
                        type="time"
                        value={headerNextTime}
                        onChange={(e) => setHeaderNextTime(e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveHeader} disabled={saving}>
                      {saving && (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      )}
                      Sauvegarder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingHeader(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(report.date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {report.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{report.location}</span>
                    </div>
                  )}
                  {report.weather && (
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-muted-foreground" />
                      <span>{report.weather}</span>
                    </div>
                  )}
                  {report.nextMeetingDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Prochaine :{" "}
                        {new Date(report.nextMeetingDate).toLocaleDateString(
                          "fr-FR"
                        )}
                        {report.nextMeetingTime &&
                          ` à ${report.nextMeetingTime}`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* General notes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Généralités
                </CardTitle>
                <div className="flex items-center gap-1 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setShowTemplateMenu(!showTemplateMenu);
                      setShowSaveTemplate(false);
                    }}
                  >
                    <BookTemplate className="h-3.5 w-3.5 mr-1" />
                    Modèles
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setShowSaveTemplate(!showSaveTemplate);
                      setShowTemplateMenu(false);
                    }}
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Sauvegarder
                  </Button>

                  {/* Template selector dropdown */}
                  {showTemplateMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-background border rounded-lg shadow-lg z-20 w-72">
                      <div className="p-2 border-b">
                        <p className="text-xs font-medium text-muted-foreground">
                          Appliquer un modèle
                        </p>
                      </div>
                      {templates.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            Aucun modèle enregistré
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Rédigez vos généralités puis cliquez
                            &quot;Sauvegarder&quot; pour créer un modèle
                          </p>
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          {templates.map((tpl) => (
                            <div
                              key={tpl.id}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-accent group"
                            >
                              <button
                                className="flex-1 text-left text-sm truncate"
                                onClick={() => applyTemplate(tpl)}
                              >
                                {tpl.isDefault && (
                                  <Star className="h-3 w-3 inline mr-1 text-yellow-500 fill-yellow-500" />
                                )}
                                {tpl.name}
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTemplate(tpl.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 text-xs"
                          onClick={() => {
                            setShowTemplateMenu(false);
                          }}
                        >
                          Fermer
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Save as template dialog */}
                  {showSaveTemplate && (
                    <div className="absolute top-full right-0 mt-1 bg-background border rounded-lg shadow-lg z-20 w-72 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Sauvegarder comme modèle
                      </p>
                      <Input
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="Nom du modèle"
                        className="h-8 text-sm mb-2"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveAsTemplate();
                        }}
                      />
                      <label className="flex items-center gap-2 text-xs text-muted-foreground mb-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTemplateDefault}
                          onChange={(e) =>
                            setNewTemplateDefault(e.target.checked)
                          }
                          className="rounded"
                        />
                        Modèle par défaut pour les nouveaux CR
                      </label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 flex-1"
                          onClick={saveAsTemplate}
                          disabled={
                            savingTemplate || !newTemplateName.trim()
                          }
                        >
                          {savingTemplate ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Enregistrer"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() => setShowSaveTemplate(false)}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                key={editorKey}
                content={generalNotes}
                onChange={saveGeneralNotes}
                placeholder="Notes générales sur l'avancement du chantier, points importants à signaler..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sauvegarde automatique
              </p>
            </CardContent>
          </Card>

          {/* Sections by company */}
          {sections.map((section) => (
            <SectionEditor
              key={section.id}
              section={section}
              observations={observations.filter(
                (o) => o.companyId === section.companyId
              )}
              reportId={report.id}
              previousReportNumber={previousReportNumber}
              companies={companies}
              onSaveContent={(content) =>
                saveSectionContent(section.id, content)
              }
              onObservationsChange={setObservations}
            />
          ))}

          {/* Observations without a company (general) */}
          <GeneralObservationsSection
            observations={observations.filter((o) => !o.companyId)}
            reportId={report.id}
            previousReportNumber={previousReportNumber}
            companies={companies}
            onObservationsChange={setObservations}
          />

          {/* Comments */}
          <CommentsSection entityType="meeting_report" entityId={report.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Attendance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Présences
                <span className="text-xs font-normal text-muted-foreground">
                  (
                  {attendances.filter((a) => a.status === "present").length}/
                  {attendances.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Aucune entreprise dans l&apos;annuaire.{" "}
                  <Link
                    href="/parametres"
                    className="text-primary underline"
                  >
                    Configurer
                  </Link>
                </p>
              ) : (
                <div className="space-y-2">
                  {attendances.map((att) => (
                    <div key={att.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium flex-1 truncate">
                          {att.company.lotNumber && (
                            <span className="text-muted-foreground">
                              {att.company.lotNumber} —{" "}
                            </span>
                          )}
                          {att.company.name}
                        </span>
                        <select
                          value={att.status}
                          onChange={(e) =>
                            toggleAttendance(att.companyId, e.target.value)
                          }
                          className="text-xs border rounded px-1.5 py-1 bg-background"
                        >
                          {ATTENDANCE_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {att.status === "present" && (
                        <Input
                          placeholder="Représentant"
                          value={att.representant}
                          onChange={(e) =>
                            updateRepresentant(att.companyId, e.target.value)
                          }
                          onBlur={() => saveRepresentant()}
                          className="h-7 text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observations summary */}
          {obsStats.total > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Observations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{obsStats.total}</span>
                  </div>
                  {obsStats.en_cours > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-blue-600">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        En cours
                      </span>
                      <span className="font-medium">{obsStats.en_cours}</span>
                    </div>
                  )}
                  {obsStats.fait > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Fait
                      </span>
                      <span className="font-medium">{obsStats.fait}</span>
                    </div>
                  )}
                  {obsStats.retard > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-red-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        En retard
                      </span>
                      <span className="font-medium">{obsStats.retard}</span>
                    </div>
                  )}
                  {obsStats.urgent > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-orange-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Urgent
                      </span>
                      <span className="font-medium">{obsStats.urgent}</span>
                    </div>
                  )}
                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex mt-1">
                    {obsStats.fait > 0 && (
                      <div
                        className="bg-green-500 h-full"
                        style={{
                          width: `${(obsStats.fait / obsStats.total) * 100}%`,
                        }}
                      />
                    )}
                    {obsStats.en_cours > 0 && (
                      <div
                        className="bg-blue-500 h-full"
                        style={{
                          width: `${(obsStats.en_cours / obsStats.total) * 100}%`,
                        }}
                      />
                    )}
                    {obsStats.retard > 0 && (
                      <div
                        className="bg-red-500 h-full"
                        style={{
                          width: `${(obsStats.retard / obsStats.total) * 100}%`,
                        }}
                      />
                    )}
                    {obsStats.urgent > 0 && (
                      <div
                        className="bg-orange-500 h-full"
                        style={{
                          width: `${(obsStats.urgent / obsStats.total) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-2">
              {report.status !== "brouillon" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => changeStatus("brouillon")}
                  disabled={saving}
                >
                  Repasser en brouillon
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer le CR
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Section Editor ─────────────────────────────────────────────────
function SectionEditor({
  section,
  observations,
  reportId,
  previousReportNumber,
  companies,
  onSaveContent,
  onObservationsChange,
}: {
  section: Section;
  observations: Observation[];
  reportId: string;
  previousReportNumber: number | null;
  companies: Company[];
  onSaveContent: (content: string) => void;
  onObservationsChange: React.Dispatch<React.SetStateAction<Observation[]>>;
}) {
  const [expanded, setExpanded] = useState(true);
  const openObs = observations.filter((o) =>
    ["en_cours", "retard", "urgent"].includes(o.status)
  ).length;
  const doneObs = observations.filter((o) => o.status === "fait").length;

  const handleSectionContentChange = useCallback(
    (json: string) => {
      onSaveContent(json);
    },
    [onSaveContent]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          className="flex items-center gap-2 w-full text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <CardTitle className="text-base flex-1">{section.title}</CardTitle>
          <div className="flex items-center gap-1.5">
            {doneObs > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-green-100 text-green-700"
              >
                {doneObs} fait{doneObs > 1 ? "s" : ""}
              </Badge>
            )}
            {openObs > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {openObs} en cours
              </Badge>
            )}
          </div>
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          <TiptapEditor
            content={section.content}
            onChange={handleSectionContentChange}
            placeholder="Notes pour cette section..."
          />

          <ObservationsList
            observations={observations}
            reportId={reportId}
            companyId={section.companyId}
            sectionId={section.id}
            previousReportNumber={previousReportNumber}
            companies={companies}
            onObservationsChange={onObservationsChange}
          />
        </CardContent>
      )}
    </Card>
  );
}

// ─── General Observations Section ───────────────────────────────────
function GeneralObservationsSection({
  observations,
  reportId,
  previousReportNumber,
  companies,
  onObservationsChange,
}: {
  observations: Observation[];
  reportId: string;
  previousReportNumber: number | null;
  companies: Company[];
  onObservationsChange: React.Dispatch<React.SetStateAction<Observation[]>>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Observations générales
          {observations.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({observations.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ObservationsList
          observations={observations}
          reportId={reportId}
          companyId={null}
          sectionId={null}
          previousReportNumber={previousReportNumber}
          companies={companies}
          onObservationsChange={onObservationsChange}
        />
      </CardContent>
    </Card>
  );
}

// ─── Observations List ──────────────────────────────────────────────
function ObservationsList({
  observations,
  reportId,
  companyId,
  sectionId,
  previousReportNumber,
  companies,
  onObservationsChange,
}: {
  observations: Observation[];
  reportId: string;
  companyId: string | null;
  sectionId: string | null;
  previousReportNumber: number | null;
  companies: Company[];
  onObservationsChange: React.Dispatch<React.SetStateAction<Observation[]>>;
}) {
  const [adding, setAdding] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function addObservation() {
    if (!newDescription.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/meeting-reports/${reportId}/observations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: newDescription.trim(),
            dueDate: newDueDate || null,
            category: newCategory || null,
            companyId,
            sectionId,
            status: "en_cours",
          }),
        }
      );
      if (!res.ok) throw new Error();
      const obs = await res.json();
      onObservationsChange((prev) => [...prev, obs]);
      setNewDescription("");
      setNewDueDate("");
      setNewCategory("");
      setAdding(false);
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateObservationStatus(obsId: string, newStatus: string) {
    const obs = observations.find((o) => o.id === obsId);
    if (!obs) return;

    try {
      await fetch(
        `/api/meeting-reports/${reportId}/observations/${obsId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: obs.description,
            status: newStatus,
            dueDate: obs.dueDate
              ? new Date(obs.dueDate).toISOString().split("T")[0]
              : null,
            doneDate:
              newStatus === "fait"
                ? new Date().toISOString().split("T")[0]
                : obs.doneDate
                ? new Date(obs.doneDate).toISOString().split("T")[0]
                : null,
            category: obs.category,
            companyId: obs.companyId,
            sectionId: obs.sectionId,
          }),
        }
      );
      onObservationsChange((prev) =>
        prev.map((o) =>
          o.id === obsId
            ? {
                ...o,
                status: newStatus,
                doneDate:
                  newStatus === "fait"
                    ? new Date().toISOString()
                    : o.doneDate,
              }
            : o
        )
      );
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function deleteObservation(obsId: string) {
    try {
      await fetch(
        `/api/meeting-reports/${reportId}/observations/${obsId}`,
        { method: "DELETE" }
      );
      onObservationsChange((prev) => prev.filter((o) => o.id !== obsId));
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Observations ({observations.length})
        </span>
        {!adding && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {observations.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground text-center py-3">
          Aucune observation
        </p>
      )}

      {observations.map((obs) => {
        const obsStatusInfo = OBSERVATION_STATUSES.find(
          (s) => s.value === obs.status
        );
        const isCarriedOver = !!obs.sourceObservationId;

        return (
          <div
            key={obs.id}
            className={`rounded-lg border p-3 space-y-1 ${
              obs.status === "fait"
                ? "bg-green-50/50 border-green-200"
                : obs.status === "retard" || obs.status === "urgent"
                ? "bg-red-50/50 border-red-200"
                : "bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {isCarriedOver && previousReportNumber && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-orange-600 border-orange-200"
                    >
                      <CornerDownRight className="h-2.5 w-2.5 mr-0.5" />
                      CR n°{previousReportNumber}
                    </Badge>
                  )}
                  {obsStatusInfo && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${obsStatusInfo.color}`}
                    >
                      {obsStatusInfo.label}
                    </Badge>
                  )}
                  {obs.category && (
                    <span className="text-[10px] text-muted-foreground">
                      {
                        OBSERVATION_CATEGORIES.find(
                          (c) => c.value === obs.category
                        )?.label
                      }
                    </span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {obs.description}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {obs.dueDate && (
                    <span
                      className={
                        new Date(obs.dueDate) < new Date() &&
                        obs.status !== "fait"
                          ? "text-red-600 font-medium"
                          : ""
                      }
                    >
                      Pour le{" "}
                      {new Date(obs.dueDate).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                  {obs.doneDate && (
                    <span className="text-green-600">
                      Fait le{" "}
                      {new Date(obs.doneDate).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <select
                  value={obs.status}
                  onChange={(e) =>
                    updateObservationStatus(obs.id, e.target.value)
                  }
                  className="text-xs border rounded px-1 py-0.5 bg-background"
                >
                  {OBSERVATION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-red-500"
                  onClick={() => deleteObservation(obs.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {adding && (
        <div className="rounded-lg border border-primary/30 p-3 space-y-2">
          <Textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description de l'observation..."
            rows={2}
            className="resize-none"
            autoFocus
          />
          <div className="flex gap-2 items-end flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <Label className="text-xs mb-1 block">Pour le</Label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <Label className="text-xs mb-1 block">Catégorie</Label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full h-7 text-xs border rounded px-2 bg-background"
              >
                <option value="">—</option>
                {OBSERVATION_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                className="h-7"
                onClick={addObservation}
                disabled={submitting || !newDescription.trim()}
              >
                {submitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Ajouter"
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                onClick={() => setAdding(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
