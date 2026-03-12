"use client";

import { useMemo } from "react";

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
  projectName: string;
  previousReportNumber: number | null;
  pdfSettings?: PdfSettings;
}

// ─── Helpers ────────────────────────────────────────────────────────
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR");
}

const STATUS_LABELS: Record<string, string> = {
  en_cours: "En cours",
  fait: "Fait",
  retard: "Retard",
  urgent: "Urgent",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  en_cours: { bg: "bg-blue-100", text: "text-blue-700" },
  fait: { bg: "bg-green-100", text: "text-green-700" },
  retard: { bg: "bg-red-100", text: "text-red-700" },
  urgent: { bg: "bg-orange-100", text: "text-orange-700" },
};

const ATTENDANCE_LABELS: Record<string, string> = {
  present: "Présent",
  absent: "Absent",
  excuse: "Excusé",
  non_convoque: "Non convoqué",
};

const ATTENDANCE_COLORS: Record<string, string> = {
  present: "text-green-700",
  absent: "text-red-600",
  excuse: "text-yellow-600",
  non_convoque: "text-gray-400",
};

// ─── Tiptap JSON → HTML ─────────────────────────────────────────────
interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string }[];
  attrs?: Record<string, unknown>;
}

function renderTiptapHtml(json: string): string {
  if (!json || json === "{}" || json === '""') return "";

  let doc: TiptapNode;
  try {
    const parsed = JSON.parse(json);
    if (parsed.type === "doc") {
      doc = parsed;
    } else if (parsed.text && typeof parsed.text === "string") {
      return `<p>${escapeHtml(parsed.text)}</p>`;
    } else {
      return "";
    }
  } catch {
    if (json.trim()) return `<p>${escapeHtml(json)}</p>`;
    return "";
  }

  if (!doc.content) return "";
  return doc.content.map(renderNodeHtml).join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderNodeHtml(node: TiptapNode): string {
  switch (node.type) {
    case "paragraph":
      return `<p style="margin:0 0 4px 0;line-height:1.5;font-size:10px">${renderInlineHtml(node.content)}</p>`;
    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const size = level === 2 ? "12px" : "11px";
      return `<p style="font-size:${size};font-weight:bold;margin:8px 0 4px 0">${renderInlineHtml(node.content)}</p>`;
    }
    case "bulletList":
      return `<ul style="margin:0 0 4px 0;padding-left:16px;font-size:10px">${(node.content ?? []).map((item) => `<li style="margin-bottom:2px">${renderInlineHtml(item.content?.[0]?.content)}</li>`).join("")}</ul>`;
    case "orderedList":
      return `<ol style="margin:0 0 4px 0;padding-left:16px;font-size:10px">${(node.content ?? []).map((item) => `<li style="margin-bottom:2px">${renderInlineHtml(item.content?.[0]?.content)}</li>`).join("")}</ol>`;
    default:
      return "";
  }
}

function renderInlineHtml(nodes?: TiptapNode[]): string {
  if (!nodes) return "";
  return nodes
    .map((node) => {
      if (node.type === "text") {
        let text = escapeHtml(node.text ?? "");
        const marks = node.marks ?? [];
        for (const mark of marks) {
          if (mark.type === "bold") text = `<strong>${text}</strong>`;
          if (mark.type === "italic") text = `<em>${text}</em>`;
          if (mark.type === "underline")
            text = `<span style="text-decoration:underline">${text}</span>`;
        }
        return text;
      }
      if (node.type === "hardBreak") return "<br/>";
      return "";
    })
    .join("");
}

// ─── Preview Component ──────────────────────────────────────────────
export function MeetingReportPreview({
  report,
  projectName,
  previousReportNumber,
  pdfSettings,
}: Props) {
  const headerColor = pdfSettings?.headerColor || "#1e3a5f";
  const today = new Date().toLocaleDateString("fr-FR");

  const generalObs = useMemo(
    () => report.observations.filter((o) => !o.companyId),
    [report.observations]
  );

  return (
    <div className="bg-white text-black" style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "10px" }}>
      {/* Cover Page */}
      {pdfSettings?.showCoverPage && (
        <div
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            borderBottom: "3px solid #e5e7eb",
            marginBottom: "20px",
            pageBreakAfter: "always",
          }}
        >
          {pdfSettings.logoUrl && (
            <img
              src={pdfSettings.logoUrl}
              alt="Logo"
              style={{ maxHeight: "120px", maxWidth: "300px", marginBottom: "40px", objectFit: "contain" }}
            />
          )}
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: headerColor, textAlign: "center", marginBottom: "12px" }}>
            {pdfSettings.coverTitle || "Compte-rendu de réunion de chantier"}
          </h1>
          {pdfSettings.coverSubtitle && (
            <p style={{ fontSize: "16px", color: "#666", textAlign: "center", marginBottom: "24px" }}>
              {pdfSettings.coverSubtitle}
            </p>
          )}
          <div style={{ fontSize: "18px", fontWeight: "bold", color: headerColor, marginBottom: "8px" }}>
            {projectName}
          </div>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
            CR n°{report.number}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            {formatDate(report.date)}
          </div>
          {pdfSettings.companyName && (
            <div style={{ fontSize: "12px", color: "#999", marginTop: "40px" }}>
              {pdfSettings.companyName}
            </div>
          )}
        </div>
      )}

      {/* A4 Page Content */}
      <div
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "40px",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: `2px solid ${headerColor}`, paddingBottom: "12px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {pdfSettings?.logoUrl && !pdfSettings.showCoverPage && (
              <img
                src={pdfSettings.logoUrl}
                alt="Logo"
                style={{ maxHeight: "50px", maxWidth: "120px", objectFit: "contain" }}
              />
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: "18px", fontWeight: "bold", color: headerColor, margin: 0 }}>
                Compte-rendu de réunion n°{report.number}
              </h1>
              <p style={{ fontSize: "11px", color: "#666", margin: "4px 0 0 0" }}>
                {projectName}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "9px", color: "#666" }}>
            <span>Date : {formatDate(report.date)}</span>
            {report.location && <span>Lieu : {report.location}</span>}
            {report.weather && <span>Météo : {report.weather}</span>}
          </div>
        </div>

        {/* Next meeting */}
        {report.nextMeetingDate && (
          <div style={{ backgroundColor: "#eff6ff", padding: "10px", borderRadius: "4px", marginBottom: "16px", fontSize: "10px", color: "#1e40af" }}>
            Prochaine réunion : {formatDate(report.nextMeetingDate)}
            {report.nextMeetingTime && ` à ${report.nextMeetingTime}`}
          </div>
        )}

        {/* Attendance table */}
        <SectionTitle color={headerColor}>Liste de présence</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px", fontSize: "9px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6" }}>
              <th style={thStyle}>Entreprise</th>
              <th style={thStyle}>Lot</th>
              <th style={thStyle}>Statut</th>
              <th style={thStyle}>Représentant</th>
            </tr>
          </thead>
          <tbody>
            {report.attendances.map((att, i) => (
              <tr key={att.id} style={{ backgroundColor: i % 2 === 1 ? "#fafafa" : "transparent" }}>
                <td style={tdStyle}>{att.company.name}</td>
                <td style={{ ...tdStyle, color: "#666" }}>
                  {att.company.lotNumber
                    ? `Lot ${att.company.lotNumber}${att.company.lotLabel ? ` — ${att.company.lotLabel}` : ""}`
                    : "—"}
                </td>
                <td style={tdStyle}>
                  <span className={ATTENDANCE_COLORS[att.status] ?? ""}>
                    {ATTENDANCE_LABELS[att.status] ?? att.status}
                  </span>
                </td>
                <td style={tdStyle}>{att.representant || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* General notes */}
        <SectionTitle color={headerColor}>Généralités</SectionTitle>
        <div dangerouslySetInnerHTML={{ __html: renderTiptapHtml(report.generalNotes) }} />

        {/* Sections by company */}
        {report.sections.map((section) => {
          const sectionObs = report.observations.filter(
            (o) => o.companyId === section.company?.id
          );

          return (
            <div key={section.id} style={{ pageBreakInside: "avoid" }}>
              <SectionTitle color={headerColor}>{section.title}</SectionTitle>
              <div dangerouslySetInnerHTML={{ __html: renderTiptapHtml(section.content) }} />

              {sectionObs.length > 0 && (
                <ObservationsTable
                  observations={sectionObs}
                  previousReportNumber={previousReportNumber}
                />
              )}
            </div>
          );
        })}

        {/* General observations */}
        {generalObs.length > 0 && (
          <div>
            <SectionTitle color={headerColor}>Observations générales</SectionTitle>
            <ObservationsTable
              observations={generalObs}
              previousReportNumber={previousReportNumber}
            />
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "8px",
          color: "#999",
          borderTop: "0.5px solid #ddd",
          paddingTop: "6px",
          marginTop: "40px",
        }}>
          <span>{pdfSettings?.footerText || `CR n°${report.number} — ${projectName}`}</span>
          <span>Édité le {today}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────
function SectionTitle({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h2 style={{
      fontSize: "13px",
      fontWeight: "bold",
      color,
      marginTop: "16px",
      marginBottom: "8px",
      paddingBottom: "4px",
      borderBottom: "1px solid #ddd",
    }}>
      {children}
    </h2>
  );
}

function ObservationsTable({
  observations,
  previousReportNumber,
}: {
  observations: Observation[];
  previousReportNumber: number | null;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "6px", marginBottom: "12px", fontSize: "9px" }}>
      <thead>
        <tr style={{ backgroundColor: "#f3f4f6" }}>
          <th style={{ ...thStyle, textAlign: "left" }}>Observation</th>
          <th style={{ ...thStyle, width: "70px" }}>Pour le</th>
          <th style={{ ...thStyle, width: "70px" }}>Fait le</th>
          <th style={{ ...thStyle, width: "60px" }}>Statut</th>
        </tr>
      </thead>
      <tbody>
        {observations.map((obs) => {
          const sc = STATUS_COLORS[obs.status] ?? { bg: "bg-gray-100", text: "text-gray-700" };
          return (
            <tr key={obs.id} style={{ borderBottom: "0.5px solid #eee" }}>
              <td style={{ ...tdStyle, textAlign: "left" }}>
                {obs.description}
                {obs.sourceObservationId && previousReportNumber && (
                  <span style={{ fontSize: "7px", color: "#ea580c", marginLeft: "4px" }}>
                    (CR n°{previousReportNumber})
                  </span>
                )}
              </td>
              <td style={{ ...tdStyle, textAlign: "center", color: "#666" }}>
                {obs.dueDate ? formatDateShort(obs.dueDate) : "—"}
              </td>
              <td style={{ ...tdStyle, textAlign: "center", color: "#666" }}>
                {obs.doneDate ? formatDateShort(obs.doneDate) : "—"}
              </td>
              <td style={{ ...tdStyle, textAlign: "center" }}>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] ${sc.bg} ${sc.text}`}>
                  {STATUS_LABELS[obs.status] ?? obs.status}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  fontSize: "8px",
  fontWeight: "bold",
  color: "#666",
  textTransform: "uppercase",
  padding: "5px 6px",
  borderBottom: "1px solid #ddd",
  textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  padding: "4px 6px",
  borderBottom: "0.5px solid #eee",
  verticalAlign: "top",
};
