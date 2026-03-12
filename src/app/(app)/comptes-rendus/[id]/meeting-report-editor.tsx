"use client";

import { useState, useCallback } from "react";
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

interface Props {
  report: MeetingReport;
  previousReportNumber: number | null;
  companies: Company[];
}

// ─── Main Editor ────────────────────────────────────────────────────
export function MeetingReportEditor({
  report: initialReport,
  previousReportNumber,
  companies,
}: Props) {
  const router = useRouter();
  const [report, setReport] = useState(initialReport);
  const [attendances, setAttendances] = useState(initialReport.attendances);
  const [sections] = useState(initialReport.sections);
  const [observations, setObservations] = useState(initialReport.observations);
  const [saving, setSaving] = useState(false);
  const [generalNotes, setGeneralNotes] = useState(initialReport.generalNotes);

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

  function saveRepresentant(companyId: string) {
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
              PDF
            </Button>
            {report.status === "brouillon" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => changeStatus("valide")}
                disabled={saving}
              >
                Valider
              </Button>
            )}
            {report.status === "valide" && (
              <Button
                size="sm"
                variant="outline"
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
                        {report.nextMeetingTime && ` à ${report.nextMeetingTime}`}
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
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Généralités
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TiptapEditor
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
          <ObservationsWithoutCompany
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
                  ({attendances.filter((a) => a.status === "present").length}/
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
                          onBlur={() => saveRepresentant(att.companyId)}
                          className="h-7 text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-2">
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
          {openObs > 0 && (
            <Badge variant="secondary" className="text-xs">
              {openObs} obs. en cours
            </Badge>
          )}
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

// ─── Observations without company ───────────────────────────────────
function ObservationsWithoutCompany({
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
  if (observations.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Observations générales</CardTitle>
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
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Ajouter
        </Button>
      </div>

      {observations.map((obs) => {
        const statusInfo = OBSERVATION_STATUSES.find(
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
                  {statusInfo && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${statusInfo.color}`}
                    >
                      {statusInfo.label}
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
                    <span>
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
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs mb-1 block">Pour le</Label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex-1">
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
