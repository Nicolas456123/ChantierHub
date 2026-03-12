"use client";

import { useMemo } from "react";

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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateLong(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<string, string> = {
  en_cours: "EN COURS",
  fait: "FAIT",
  retard: "RETARD",
  urgent: "URGENT",
};

const STATUS_COLORS: Record<string, string> = {
  en_cours: "#1d4ed8",
  fait: "#16a34a",
  retard: "#dc2626",
  urgent: "#ea580c",
};

const ATTENDANCE_LABELS: Record<string, string> = {
  present: "P",
  absent: "A",
  excuse: "E",
  non_convoque: "NC",
};

const CATEGORY_LABELS: Record<string, string> = {
  administratif: "ADMINISTRATIF",
  etudes: "\u00c9TUDES",
  controle: "BUREAU DE CONTR\u00d4LE",
  avancement: "Point effectif / avancement / pr\u00e9visions",
  visite: "Visite de chantier et d\u00e9tails d\u2019ex\u00e9cution",
};

const CATEGORY_ORDER = ["administratif", "etudes", "controle", "avancement", "visite"];

interface Contact {
  name: string;
  phone?: string;
  email?: string;
  role?: string;
}

function parseContacts(contactsJson?: string): Contact[] {
  if (!contactsJson) return [];
  try {
    const parsed = JSON.parse(contactsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderNodeHtml(node: TiptapNode): string {
  switch (node.type) {
    case "paragraph":
      return `<p style="margin:2px 0;line-height:1.5;font-size:10px">${renderInlineHtml(node.content)}</p>`;
    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const size = level === 2 ? "12px" : "11px";
      return `<p style="font-size:${size};font-weight:bold;margin:8px 0 3px 0">${renderInlineHtml(node.content)}</p>`;
    }
    case "bulletList":
      return `<ul style="margin:2px 0 4px 0;padding-left:16px;font-size:10px">${(node.content ?? []).map(renderListItemHtml).join("")}</ul>`;
    case "orderedList":
      return `<ol style="margin:2px 0 4px 0;padding-left:16px;font-size:10px">${(node.content ?? []).map(renderListItemHtml).join("")}</ol>`;
    default:
      return "";
  }
}

function renderListItemHtml(item: TiptapNode): string {
  if (!item.content) return "<li></li>";
  const inner = item.content.map((child) => {
    if (child.type === "paragraph") return renderInlineHtml(child.content);
    if (child.type === "bulletList" || child.type === "orderedList") return renderNodeHtml(child);
    return "";
  }).join("");
  return `<li style="margin-bottom:1px">${inner}</li>`;
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
          if (mark.type === "underline") text = `<span style="text-decoration:underline">${text}</span>`;
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
  const companyName = pdfSettings?.companyName || "";
  const crDate = formatDate(report.date);
  const footerLeft = pdfSettings?.footerText || companyName || projectName;
  const footerCenter = `CR du ${crDate}`;

  const generalObs = useMemo(
    () => report.observations.filter((o) => !o.companyId),
    [report.observations]
  );

  return (
    <div className="bg-white text-black" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10px" }}>
      {/* ═══════════ COVER PAGE ═══════════ */}
      {pdfSettings?.showCoverPage && (
        <div style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "30px 40px",
          display: "flex",
          flexDirection: "column",
          borderBottom: "3px solid #e5e7eb",
          marginBottom: "20px",
          pageBreakAfter: "always",
          boxSizing: "border-box",
        }}>
          {/* Top: Logo + Company Info */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "40px" }}>
            {pdfSettings.logoUrl && (
              <img
                src={pdfSettings.logoUrl}
                alt="Logo"
                style={{ maxHeight: "80px", maxWidth: "200px", objectFit: "contain" }}
              />
            )}
            {(companyName || pdfSettings.companyAddress) && (
              <div style={{ fontSize: "9px", color: "#444", lineHeight: "1.4" }}>
                {companyName && <div style={{ fontWeight: "bold", fontSize: "11px" }}>{companyName}</div>}
                {pdfSettings.companyAddress && (
                  <div style={{ whiteSpace: "pre-line", marginTop: "2px" }}>
                    {pdfSettings.companyAddress}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center: Title Block */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div style={{
              border: `3px solid ${headerColor}`,
              padding: "30px 60px",
              textAlign: "center",
              marginBottom: "30px",
              width: "80%",
            }}>
              <div style={{ fontSize: "22px", fontWeight: "bold", color: headerColor, letterSpacing: "1px" }}>
                {pdfSettings.coverTitle || "COMPTE-RENDU"}
              </div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: headerColor, marginTop: "4px" }}>
                {pdfSettings.coverSubtitle || "R\u00c9UNION DE CHANTIER"}
              </div>
              <div style={{ fontSize: "14px", color: headerColor, marginTop: "12px", fontWeight: "bold" }}>
                R\u00e9union du {formatDateLong(report.date)}
              </div>
            </div>

            {/* Project Info */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#333", marginBottom: "6px" }}>
                {projectName}
              </div>
              {pdfSettings.projectDescription && (
                <div style={{ fontSize: "12px", color: "#555", marginBottom: "6px", maxWidth: "400px" }}>
                  {pdfSettings.projectDescription}
                </div>
              )}
              {pdfSettings.siteAddress && (
                <div style={{ fontSize: "11px", color: "#666" }}>
                  {pdfSettings.siteAddress}
                </div>
              )}
            </div>

            <div style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
              CR n&deg;{report.number}
            </div>

            {/* Site Photo */}
            {pdfSettings.sitePhotoUrl && (
              <div style={{ marginTop: "30px" }}>
                <img
                  src={pdfSettings.sitePhotoUrl}
                  alt="Photo du chantier"
                  style={{
                    maxHeight: "250px",
                    maxWidth: "400px",
                    objectFit: "cover",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                />
              </div>
            )}
          </div>

          {/* Bottom */}
          <div style={{ textAlign: "center", fontSize: "10px", color: "#999", paddingTop: "20px" }}>
            &Eacute;dit&eacute; le {new Date().toLocaleDateString("fr-FR")}
          </div>
        </div>
      )}

      {/* ═══════════ CONTENT PAGES ═══════════ */}
      <div style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "25px 35px 50px 35px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>
        {/* Page header with logo */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          {pdfSettings?.logoUrl && (
            <img
              src={pdfSettings.logoUrl}
              alt="Logo"
              style={{ maxHeight: "40px", maxWidth: "150px", objectFit: "contain" }}
            />
          )}
          <div style={{ flex: 1 }} />
        </div>

        {/* ─── Attendance Table ─── */}
        <SectionBanner color={headerColor}>LISTE DE PR&Eacute;SENCE</SectionBanner>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "9px" }}>
          <thead>
            <tr>
              <th style={thStyleBorder}>D&eacute;signation</th>
              <th style={thStyleBorder}>Soci&eacute;t&eacute;</th>
              <th style={thStyleBorder}>Nom</th>
              <th style={{ ...thStyleBorder, width: "55px", textAlign: "center" }}>Pr&eacute;sence</th>
              <th style={{ ...thStyleBorder, width: "55px", textAlign: "center" }}>Convocation</th>
            </tr>
          </thead>
          <tbody>
            {report.attendances.map((att) => {
              const contacts = parseContacts(att.company.contacts);
              const designation = att.company.lotNumber
                ? `Lot ${att.company.lotNumber}${att.company.lotLabel ? ` \u2014 ${att.company.lotLabel}` : ""}`
                : att.company.lotLabel || "\u2014";

              return (
                <tr key={att.id}>
                  <td style={tdStyleBorder}>{designation}</td>
                  <td style={{ ...tdStyleBorder, fontWeight: "bold" }}>{att.company.name}</td>
                  <td style={tdStyleBorder}>
                    {att.representant || (contacts.length > 0 ? contacts[0].name : "\u2014")}
                    {contacts.length > 0 && contacts[0].phone && (
                      <span style={{ display: "block", fontSize: "7.5px", color: "#666" }}>
                        {contacts[0].phone}
                      </span>
                    )}
                    {contacts.length > 0 && contacts[0].email && (
                      <span style={{ display: "block", fontSize: "7.5px", color: "#666" }}>
                        {contacts[0].email}
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyleBorder, textAlign: "center", fontWeight: "bold" }}>
                    <span style={{ color: att.status === "present" ? "#16a34a" : att.status === "absent" ? "#dc2626" : "#666" }}>
                      {ATTENDANCE_LABELS[att.status] ?? att.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyleBorder, textAlign: "center", fontSize: "8px" }}>
                    {att.status !== "non_convoque" ? "Oui" : "Non"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Attendance legend */}
        <div style={{ fontSize: "7.5px", color: "#888", marginBottom: "16px", display: "flex", gap: "12px" }}>
          <span><strong>P</strong> = Pr&eacute;sent</span>
          <span><strong>A</strong> = Absent</span>
          <span><strong>E</strong> = Excus&eacute;</span>
          <span><strong>NC</strong> = Non convoqu&eacute;</span>
        </div>

        {/* ─── Next meeting ─── */}
        {report.nextMeetingDate && (
          <div style={{
            border: `2px solid ${headerColor}`,
            padding: "10px 16px",
            marginBottom: "16px",
            textAlign: "center",
          }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", color: headerColor }}>
              PROCHAINE R&Eacute;UNION : {formatDateLong(report.nextMeetingDate).toUpperCase()}
              {report.nextMeetingTime && ` &Agrave; ${report.nextMeetingTime}`}
            </span>
            {report.location && (
              <span style={{ fontSize: "10px", color: "#666", marginLeft: "12px" }}>
                &mdash; {report.location}
              </span>
            )}
          </div>
        )}

        {/* ─── Généralités ─── */}
        <SectionBanner color={headerColor}>G&Eacute;N&Eacute;RALIT&Eacute;S</SectionBanner>
        <div style={{ marginBottom: "20px" }}>
          <div dangerouslySetInnerHTML={{ __html: renderTiptapHtml(report.generalNotes) }} />
        </div>

        {/* ─── Company Sections ─── */}
        {report.sections.map((section) => {
          const sectionObs = report.observations.filter(
            (o) => o.companyId === section.company?.id
          );

          return (
            <div key={section.id} style={{ pageBreakInside: "avoid", marginBottom: "20px" }}>
              {/* Company Section Header */}
              <CompanySectionHeader section={section} color={headerColor} />

              {/* Section rich text content */}
              {section.content && section.content !== "{}" && (
                <div style={{ marginBottom: "8px" }}>
                  <div dangerouslySetInnerHTML={{ __html: renderTiptapHtml(section.content) }} />
                </div>
              )}

              {/* Observations Table grouped by category */}
              <ObservationsCategoryTable
                observations={sectionObs}
                previousReportNumber={previousReportNumber}
              />
            </div>
          );
        })}

        {/* ─── General observations ─── */}
        {generalObs.length > 0 && (
          <div>
            <SectionBanner color={headerColor}>OBSERVATIONS G&Eacute;N&Eacute;RALES</SectionBanner>
            <ObservationsCategoryTable
              observations={generalObs}
              previousReportNumber={previousReportNumber}
            />
          </div>
        )}

        {/* ─── Footer ─── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "8px",
          color: "#666",
          borderTop: "1px solid #ccc",
          paddingTop: "8px",
          marginTop: "40px",
        }}>
          <span>{footerLeft}</span>
          <span>{footerCenter}</span>
          <span>Page 1</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function SectionBanner({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{
      backgroundColor: color,
      color: "white",
      padding: "8px 16px",
      fontSize: "12px",
      fontWeight: "bold",
      letterSpacing: "0.5px",
      marginBottom: "10px",
      marginTop: "16px",
      textAlign: "center",
    }}>
      {children}
    </div>
  );
}

function CompanySectionHeader({ section, color }: { section: Section; color: string }) {
  const company = section.company;
  if (!company) {
    return <SectionBanner color={color}>{section.title}</SectionBanner>;
  }

  const lotLine = company.lotNumber ? `LOT n\u00b0 ${company.lotNumber}` : null;
  const lotLabel = company.lotLabel || "";
  const companyName = company.name;

  return (
    <div style={{
      border: `2px solid ${color}`,
      padding: "12px 20px",
      textAlign: "center",
      marginBottom: "10px",
      marginTop: "20px",
      pageBreakInside: "avoid",
    }}>
      {lotLine && (
        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#333" }}>
          {lotLine}
        </div>
      )}
      {lotLabel && (
        <div style={{ fontSize: "13px", fontWeight: "bold", color: "#333" }}>
          {lotLabel}
        </div>
      )}
      <div style={{ fontSize: "13px", fontWeight: "bold", color: "#333" }}>
        {companyName}
      </div>
    </div>
  );
}

function ObservationsCategoryTable({
  observations,
  previousReportNumber,
}: {
  observations: Observation[];
  previousReportNumber: number | null;
}) {
  // Group observations by category
  const obsByCategory: Record<string, Observation[]> = {};
  for (const cat of CATEGORY_ORDER) {
    obsByCategory[cat] = [];
  }
  obsByCategory["_other"] = [];

  for (const obs of observations) {
    const cat = obs.category && CATEGORY_ORDER.includes(obs.category) ? obs.category : "_other";
    obsByCategory[cat].push(obs);
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px", marginBottom: "12px" }}>
      <tbody>
        {CATEGORY_ORDER.map((cat, idx) => (
          <CategoryRows
            key={cat}
            index={idx + 1}
            label={CATEGORY_LABELS[cat]}
            observations={obsByCategory[cat]}
            previousReportNumber={previousReportNumber}
          />
        ))}
        {obsByCategory["_other"].length > 0 && (
          <CategoryRows
            index={6}
            label="DIVERS"
            observations={obsByCategory["_other"]}
            previousReportNumber={previousReportNumber}
          />
        )}
      </tbody>
    </table>
  );
}

function CategoryRows({
  index,
  label,
  observations,
  previousReportNumber,
}: {
  index: number;
  label: string;
  observations: Observation[];
  previousReportNumber: number | null;
}) {
  return (
    <>
      {/* Category header row */}
      <tr>
        <td style={{
          ...tdStyleBorder,
          fontWeight: "bold",
          fontSize: "9px",
          backgroundColor: "#f0f0f0",
          width: "60%",
          padding: "5px 8px",
        }}>
          {index}. {label}
        </td>
        <td style={{
          ...tdStyleBorder,
          width: "20%",
          textAlign: "center",
          fontSize: "8px",
          fontWeight: "bold",
          backgroundColor: "#f0f0f0",
          padding: "5px 4px",
        }}>
          Pour le :
        </td>
        <td style={{
          ...tdStyleBorder,
          width: "20%",
          textAlign: "center",
          fontSize: "8px",
          fontWeight: "bold",
          backgroundColor: "#f0f0f0",
          padding: "5px 4px",
        }}>
          Fait le :
        </td>
      </tr>
      {/* Observation rows */}
      {observations.map((obs) => {
        const statusColor = STATUS_COLORS[obs.status] ?? "#333";
        const isRetardOrUrgent = obs.status === "retard" || obs.status === "urgent";
        return (
          <tr key={obs.id}>
            <td style={{
              ...tdStyleBorder,
              padding: "4px 8px 4px 20px",
              color: isRetardOrUrgent ? "#dc2626" : "#333",
              fontStyle: isRetardOrUrgent ? "italic" : "normal",
            }}>
              {obs.description}
              {obs.sourceObservationId && previousReportNumber && (
                <span style={{ fontSize: "7px", color: "#ea580c", marginLeft: "4px" }}>
                  (CR n&deg;{previousReportNumber})
                </span>
              )}
            </td>
            <td style={{
              ...tdStyleBorder,
              textAlign: "center",
              fontSize: "8px",
              color: isRetardOrUrgent ? "#dc2626" : "#666",
            }}>
              {obs.dueDate ? formatDate(obs.dueDate) : ""}
            </td>
            <td style={{
              ...tdStyleBorder,
              textAlign: "center",
              fontSize: "8px",
              fontWeight: isRetardOrUrgent ? "bold" : "normal",
              color: statusColor,
            }}>
              {obs.status === "fait" && obs.doneDate
                ? formatDate(obs.doneDate)
                : STATUS_LABELS[obs.status] ?? ""}
            </td>
          </tr>
        );
      })}
      {/* Empty row if no observations */}
      {observations.length === 0 && (
        <tr>
          <td style={{ ...tdStyleBorder, padding: "4px 8px 4px 20px", color: "#ccc" }}>&nbsp;</td>
          <td style={{ ...tdStyleBorder, textAlign: "center" }}>&nbsp;</td>
          <td style={{ ...tdStyleBorder, textAlign: "center" }}>&nbsp;</td>
        </tr>
      )}
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const thStyleBorder: React.CSSProperties = {
  fontSize: "8px",
  fontWeight: "bold",
  color: "#333",
  textTransform: "uppercase",
  padding: "6px 8px",
  border: "1px solid #333",
  textAlign: "left",
  backgroundColor: "#f0f0f0",
};

const tdStyleBorder: React.CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #999",
  verticalAlign: "top",
  fontSize: "9px",
};
