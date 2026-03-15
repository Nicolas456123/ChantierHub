"use client";

import { useMemo, useRef, useCallback } from "react";

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
  fontFamily?: string;
  showContacts?: boolean;
  showConvocation?: boolean;
  visibleCategories?: string[];
}

interface Props {
  report: MeetingReport;
  companies?: Company[];
  projectName: string;
  previousReportNumber: number | null;
  pdfSettings?: PdfSettings;
  onColumnResize?: (table: "attendance" | "observations", key: string, value: string) => void;
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

function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  administratif: "Admin.",
  etudes: "\u00c9tudes",
  controle: "Contr\u00f4le",
  avancement: "Avanc.",
  visite: "Visite",
};

const ATTENDANCE_LABELS: Record<string, string> = {
  present: "P",
  absent: "A",
  excuse: "E",
  non_convoque: "NC",
};

const ATTENDANCE_COLORS: Record<string, string> = {
  present: "#16a34a",
  absent: "#dc2626",
  excuse: "#6b7280",
  non_convoque: "#9ca3af",
};

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

function sortByLotNumber<T>(items: T[], getCompany: (item: T) => Company | null | undefined): T[] {
  return [...items].sort((a, b) => {
    const compA = getCompany(a);
    const compB = getCompany(b);
    const lotA = compA?.lotNumber ?? "zzz";
    const lotB = compB?.lotNumber ?? "zzz";
    return lotA.localeCompare(lotB, undefined, { numeric: true });
  });
}

const DEFAULT_ATTENDANCE_WIDTHS = {
  designation: "25%",
  societe: "22%",
  nom: "26%",
  presence: "12%",
  convocation: "15%",
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
    if (parsed.type === "doc") doc = parsed;
    else if (parsed.text && typeof parsed.text === "string") return `<p>${escapeHtml(parsed.text)}</p>`;
    else return "";
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
      return `<p style="margin:3px 0;line-height:1.6;font-size:10px">${renderInlineHtml(node.content)}</p>`;
    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const size = level === 2 ? "12px" : "11px";
      return `<p style="font-size:${size};font-weight:600;margin:8px 0 4px 0">${renderInlineHtml(node.content)}</p>`;
    }
    case "bulletList":
      return `<ul style="margin:3px 0 5px 0;padding-left:16px;font-size:10px">${(node.content ?? []).map(renderListItemHtml).join("")}</ul>`;
    case "orderedList":
      return `<ol style="margin:3px 0 5px 0;padding-left:16px;font-size:10px">${(node.content ?? []).map(renderListItemHtml).join("")}</ol>`;
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
  return `<li style="margin-bottom:2px">${inner}</li>`;
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

// ─── Resizable Column Header ─────────────────────────────────────────
function ResizableTh({
  children,
  style,
  colKey,
  tableType,
  onResize,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
  colKey: string;
  tableType: "attendance" | "observations";
  onResize?: (table: "attendance" | "observations", key: string, value: string) => void;
}) {
  const thRef = useRef<HTMLTableCellElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);
  const tableW = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onResize || !thRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = thRef.current.offsetWidth;
    const table = thRef.current.closest("table");
    tableW.current = table?.offsetWidth ?? 600;

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientX - startX.current;
      const newW = Math.max(30, startW.current + delta);
      const pct = Math.round((newW / tableW.current) * 100);
      onResize(tableType, colKey, `${pct}%`);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [onResize, tableType, colKey]);

  if (!onResize) {
    return <th ref={thRef} style={style}>{children}</th>;
  }

  return (
    <th ref={thRef} style={{ ...style, position: "relative" }}>
      {children}
      <div
        onMouseDown={onMouseDown}
        style={{
          position: "absolute",
          top: 0,
          right: -3,
          width: 6,
          height: "100%",
          cursor: "col-resize",
          zIndex: 10,
          background: "transparent",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = "rgba(37,99,235,0.3)";
        }}
        onMouseLeave={(e) => {
          if (!dragging.current) (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
      />
    </th>
  );
}

// ─── Status rendering ───────────────────────────────────────────────
function renderObsStatus(obs: Observation): { text: string; color: string; bold: boolean } {
  if (obs.status === "fait") {
    return {
      text: obs.doneDate ? `Fait ${formatDateShort(obs.doneDate)}` : "Fait",
      color: "#16a34a",
      bold: false,
    };
  }
  if (obs.status === "retard") return { text: "RETARD", color: "#dc2626", bold: true };
  if (obs.status === "urgent") return { text: "URGENT", color: "#ea580c", bold: true };
  return { text: "En cours", color: "#2563eb", bold: false };
}

// ─── Preview Component ──────────────────────────────────────────────
export function MeetingReportPreview({
  report,
  companies: allCompanies,
  projectName,
  previousReportNumber,
  pdfSettings,
  onColumnResize,
}: Props) {
  const accent = pdfSettings?.headerColor || "#2563eb";
  const companyName = pdfSettings?.companyName || "";
  const crDate = formatDate(report.date);
  const footerLeft = pdfSettings?.footerText || companyName || projectName;
  const footerCenter = `CR n\u00b0${report.number} \u2014 ${crDate}`;
  const fontFamily = pdfSettings?.fontFamily || "Arial, Helvetica, sans-serif";
  const showContacts = pdfSettings?.showContacts !== false;
  const showConvocation = pdfSettings?.showConvocation !== false;

  const attWidths = { ...DEFAULT_ATTENDANCE_WIDTHS, ...pdfSettings?.columnWidths?.attendance };

  // Build full attendance list: all companies with their attendance status
  const sortedAttendances = useMemo(() => {
    const attendanceMap = new Map(
      report.attendances.map((att) => [att.companyId, att])
    );
    // If allCompanies provided, merge with attendances
    if (allCompanies && allCompanies.length > 0) {
      const merged: Attendance[] = allCompanies.map((company) => {
        const existing = attendanceMap.get(company.id);
        if (existing) return existing;
        return {
          id: `virtual-${company.id}`,
          companyId: company.id,
          status: "non_convoque",
          representant: "",
          company,
        };
      });
      return sortByLotNumber(merged, (att) => att.company);
    }
    return sortByLotNumber(report.attendances, (att) => att.company);
  }, [report.attendances, allCompanies]);

  const sortedSections = useMemo(
    () => sortByLotNumber(report.sections, (sec) => sec.company),
    [report.sections]
  );

  const generalObs = useMemo(
    () => report.observations.filter((o) => !o.companyId),
    [report.observations]
  );

  return (
    <div className="bg-white text-black" style={{ fontFamily, fontSize: "10px", color: "#222" }}>
      {/* ═══════════ COVER PAGE ═══════════ */}
      {pdfSettings?.showCoverPage && (
        <CoverPage report={report} projectName={projectName} pdfSettings={pdfSettings} accent={accent} companyName={companyName} />
      )}

      {/* ═══════════ CONTENT PAGES ═══════════ */}
      <div style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "28px 35px 50px 35px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>
        {/* Page header with logo */}
        {pdfSettings?.logoUrl && (
          <div style={{ marginBottom: "16px" }}>
            <img src={pdfSettings.logoUrl} alt="Logo" style={{ maxHeight: "35px", maxWidth: "130px", objectFit: "contain" }} />
          </div>
        )}

        {/* ─── Attendance Table ─── */}
        <SectionTitle color={accent}>Pr{"\u00e9"}sences</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px", fontSize: "9px" }}>
          <thead>
            <tr>
              <ResizableTh style={{ ...thStyle, width: attWidths.designation, borderBottomColor: accent }} colKey="designation" tableType="attendance" onResize={onColumnResize}>Lot</ResizableTh>
              <ResizableTh style={{ ...thStyle, width: attWidths.societe, borderBottomColor: accent }} colKey="societe" tableType="attendance" onResize={onColumnResize}>Entreprise</ResizableTh>
              <ResizableTh style={{ ...thStyle, width: attWidths.nom, borderBottomColor: accent }} colKey="nom" tableType="attendance" onResize={onColumnResize}>Repr{"\u00e9"}sentant</ResizableTh>
              <ResizableTh style={{ ...thStyle, width: attWidths.presence, textAlign: "center", borderBottomColor: accent }} colKey="presence" tableType="attendance" onResize={onColumnResize}>Pr{"\u00e9"}s.</ResizableTh>
              {showConvocation && (
                <ResizableTh style={{ ...thStyle, width: attWidths.convocation, textAlign: "center", borderBottomColor: accent }} colKey="convocation" tableType="attendance" onResize={onColumnResize}>Conv.</ResizableTh>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedAttendances.map((att, i) => {
              const contacts = parseContacts(att.company.contacts);
              const lotDisplay = att.company.lotNumber ? `Lot ${att.company.lotNumber}` : "\u2014";
              const lotLabel = att.company.lotLabel || "";
              const isAlt = i % 2 === 1;

              return (
                <tr key={att.id} style={isAlt ? { backgroundColor: "#fafbfc" } : undefined}>
                  <td style={{ ...tdStyle, width: attWidths.designation }}>
                    <span style={{ fontWeight: "600" }}>{lotDisplay}</span>
                    {lotLabel && <span style={{ display: "block", fontSize: "8px", color: "#666" }}>{lotLabel}</span>}
                  </td>
                  <td style={{ ...tdStyle, width: attWidths.societe, fontWeight: "600" }}>{att.company.name}</td>
                  <td style={{ ...tdStyle, width: attWidths.nom }}>
                    {contacts.length > 0 ? contacts.map((contact, ci) => (
                      <div key={ci} style={ci > 0 ? { marginTop: "3px", borderTop: "1px solid #f0f0f0", paddingTop: "2px" } : undefined}>
                        <span style={{ fontWeight: "500", fontSize: "9px" }}>
                          {contact.name}
                          {contact.role && <span style={{ fontWeight: "normal", color: "#888", fontSize: "7.5px" }}> ({contact.role})</span>}
                        </span>
                        {showContacts && (contact.phone || contact.email) && (
                          <span style={{ display: "block", fontSize: "7.5px", color: "#888" }}>
                            {[contact.phone, contact.email].filter(Boolean).join(" \u2022 ")}
                          </span>
                        )}
                      </div>
                    )) : (
                      <span style={{ fontWeight: "500" }}>
                        {att.representant || "\u2014"}
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, width: attWidths.presence, textAlign: "center" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "1px 6px",
                      borderRadius: "3px",
                      fontSize: "8px",
                      fontWeight: "bold",
                      color: "white",
                      backgroundColor: ATTENDANCE_COLORS[att.status] ?? "#999",
                    }}>
                      {ATTENDANCE_LABELS[att.status] ?? att.status}
                    </span>
                  </td>
                  {showConvocation && (
                    <td style={{ ...tdStyle, width: attWidths.convocation, textAlign: "center", fontSize: "8px", color: "#555" }}>
                      {att.status !== "non_convoque" ? "Oui" : "Non"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Attendance legend */}
        <div style={{ fontSize: "7.5px", color: "#999", marginBottom: "20px", display: "flex", gap: "14px" }}>
          <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#16a34a", verticalAlign: "middle", marginRight: "3px" }} /> Pr{"\u00e9"}sent</span>
          <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#dc2626", verticalAlign: "middle", marginRight: "3px" }} /> Absent</span>
          <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#6b7280", verticalAlign: "middle", marginRight: "3px" }} /> Excus{"\u00e9"}</span>
          <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#9ca3af", verticalAlign: "middle", marginRight: "3px" }} /> Non convoqu{"\u00e9"}</span>
        </div>

        {/* ─── Next meeting ─── */}
        {report.nextMeetingDate && (
          <div style={{
            backgroundColor: "#f8fafc",
            borderLeft: `4px solid ${accent}`,
            padding: "10px 16px",
            marginBottom: "20px",
            borderRadius: "0 4px 4px 0",
          }}>
            <span style={{ fontSize: "10px", fontWeight: "bold", color: "#333" }}>
              Prochaine r{"\u00e9"}union :{" "}
            </span>
            <span style={{ fontSize: "10px", color: "#444" }}>
              {formatDateLong(report.nextMeetingDate)}
              {report.nextMeetingTime && ` \u00e0 ${report.nextMeetingTime}`}
              {report.location && ` \u2014 ${report.location}`}
            </span>
          </div>
        )}

        {/* ─── Généralités ─── */}
        {report.generalNotes && report.generalNotes !== "{}" && report.generalNotes !== '""' && (
          <>
            <SectionTitle color={accent}>G{"\u00e9"}n{"\u00e9"}ralit{"\u00e9"}s</SectionTitle>
            <div style={{ marginBottom: "24px" }}>
              <div dangerouslySetInnerHTML={{ __html: renderTiptapHtml(report.generalNotes) }} />
            </div>
          </>
        )}

        {/* ─── Company Sections ─── */}
        {sortedSections.map((section) => {
          const sectionObs = report.observations.filter(
            (o) => o.companyId === section.company?.id
          );

          return (
            <div key={section.id} style={{ pageBreakInside: "avoid", marginBottom: "24px" }}>
              <CompanySectionHeader section={section} color={accent} />

              {section.content && section.content !== "{}" && (
                <div style={{ marginBottom: "8px" }}>
                  <div dangerouslySetInnerHTML={{ __html: renderTiptapHtml(section.content) }} />
                </div>
              )}

              <ObservationsTable
                observations={sectionObs}
                previousReportNumber={previousReportNumber}
                color={accent}
                onColumnResize={onColumnResize}
              />
            </div>
          );
        })}

        {/* ─── General observations ─── */}
        {generalObs.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <SectionTitle color={accent}>Observations g{"\u00e9"}n{"\u00e9"}rales</SectionTitle>
            <ObservationsTable
              observations={generalObs}
              previousReportNumber={previousReportNumber}
              color={accent}
              onColumnResize={onColumnResize}
            />
          </div>
        )}

        {/* ─── Footer ─── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "8px",
          color: "#999",
          borderTop: "1px solid #e5e7eb",
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

// ─── Cover Page ─────────────────────────────────────────────────────
function CoverPage({ report, projectName, pdfSettings, accent, companyName }: {
  report: MeetingReport; projectName: string; pdfSettings: PdfSettings; accent: string; companyName: string;
}) {
  return (
    <div style={{
      width: "210mm", minHeight: "297mm", padding: "40px 50px",
      display: "flex", flexDirection: "column",
      borderBottom: "2px solid #e5e7eb", marginBottom: "20px",
      pageBreakAfter: "always", boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "60px" }}>
        {pdfSettings.logoUrl && (
          <img src={pdfSettings.logoUrl} alt="Logo" style={{ maxHeight: "70px", maxWidth: "180px", objectFit: "contain" }} />
        )}
        {(companyName || pdfSettings.companyAddress) && (
          <div style={{ fontSize: "9px", color: "#555", lineHeight: "1.5" }}>
            {companyName && <div style={{ fontWeight: "bold", fontSize: "10px", color: "#333" }}>{companyName}</div>}
            {pdfSettings.companyAddress && <div style={{ whiteSpace: "pre-line", marginTop: "2px" }}>{pdfSettings.companyAddress}</div>}
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "60px", height: "3px", backgroundColor: accent, marginBottom: "24px" }} />
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#222", letterSpacing: "2px", textTransform: "uppercase" }}>
            {pdfSettings.coverTitle || "Compte-rendu"}
          </div>
          <div style={{ fontSize: "15px", color: "#555", marginTop: "8px", fontWeight: "500" }}>
            {pdfSettings.coverSubtitle || "R\u00e9union de chantier"}
          </div>
          <div style={{ width: "40px", height: "2px", backgroundColor: accent, margin: "16px auto" }} />
          <div style={{ fontSize: "13px", color: "#444", marginTop: "8px" }}>{formatDateLong(report.date)}</div>
        </div>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#222", marginBottom: "8px" }}>{projectName}</div>
          {pdfSettings.projectDescription && (
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px", maxWidth: "380px", lineHeight: "1.5" }}>{pdfSettings.projectDescription}</div>
          )}
          {pdfSettings.siteAddress && <div style={{ fontSize: "10px", color: "#888" }}>{pdfSettings.siteAddress}</div>}
        </div>
        <div style={{ display: "inline-block", padding: "6px 20px", backgroundColor: accent, color: "white", fontSize: "12px", fontWeight: "bold", letterSpacing: "1px", borderRadius: "2px" }}>
          CR N°{report.number}
        </div>
        {pdfSettings.sitePhotoUrl && (
          <div style={{ marginTop: "36px" }}>
            <img src={pdfSettings.sitePhotoUrl} alt="Photo du chantier" style={{ maxHeight: "220px", maxWidth: "380px", objectFit: "cover", borderRadius: "4px" }} />
          </div>
        )}
      </div>
      <div style={{ textAlign: "center", fontSize: "9px", color: "#aaa", paddingTop: "16px" }}>
        {`\u00c9dit\u00e9 le ${new Date().toLocaleDateString("fr-FR")}`}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function SectionTitle({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{
      fontSize: "12px", fontWeight: "bold", color: "#222",
      paddingBottom: "6px", borderBottom: `2px solid ${color}`,
      marginBottom: "10px", marginTop: "20px",
      textTransform: "uppercase", letterSpacing: "0.5px",
    }}>
      {children}
    </div>
  );
}

function CompanySectionHeader({ section, color }: { section: Section; color: string }) {
  const company = section.company;
  if (!company) return <SectionTitle color={color}>{section.title}</SectionTitle>;

  return (
    <div style={{
      borderBottom: `2px solid ${color}`,
      padding: "8px 0",
      marginBottom: "10px",
      marginTop: "22px",
      display: "flex", alignItems: "baseline", gap: "8px",
    }}>
      {company.lotNumber && (
        <span style={{ fontSize: "12px", fontWeight: "bold", color: color }}>
          Lot {company.lotNumber}
        </span>
      )}
      <span style={{ fontSize: "12px", fontWeight: "bold", color: "#222" }}>{company.name}</span>
      {company.lotLabel && (
        <span style={{ fontSize: "10px", color: "#666" }}>{"\u2014"} {company.lotLabel}</span>
      )}
    </div>
  );
}

// ─── Single flat observations table per lot ─────────────────────────
function ObservationsTable({
  observations,
  previousReportNumber,
  color,
  onColumnResize,
}: {
  observations: Observation[];
  previousReportNumber: number | null;
  color: string;
  onColumnResize?: (table: "attendance" | "observations", key: string, value: string) => void;
}) {
  if (observations.length === 0) {
    return (
      <div style={{ fontSize: "9px", color: "#bbb", padding: "6px 0", fontStyle: "italic" }}>
        Aucune observation
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px", marginBottom: "4px" }}>
      <thead>
        <tr>
          <th style={{ ...obsThStyle, width: "5%", borderBottomColor: color, textAlign: "center" }}>#</th>
          <ResizableTh style={{ ...obsThStyle, borderBottomColor: color }} colKey="description" tableType="observations" onResize={onColumnResize}>Observation</ResizableTh>
          <ResizableTh style={{ ...obsThStyle, width: "12%", textAlign: "center", borderBottomColor: color }} colKey="pourLe" tableType="observations" onResize={onColumnResize}>{"\u00c9"}ch{"\u00e9"}ance</ResizableTh>
          <ResizableTh style={{ ...obsThStyle, width: "14%", textAlign: "center", borderBottomColor: color }} colKey="faitLe" tableType="observations" onResize={onColumnResize}>Statut</ResizableTh>
        </tr>
      </thead>
      <tbody>
        {observations.map((obs, i) => {
          const status = renderObsStatus(obs);
          const isAlert = obs.status === "retard" || obs.status === "urgent";

          return (
            <tr key={obs.id} style={i % 2 === 1 ? { backgroundColor: "#fafbfc" } : undefined}>
              <td style={{ ...obsTdStyle, textAlign: "center", color: "#999", fontSize: "8px" }}>{i + 1}</td>
              <td style={{ ...obsTdStyle }}>
                <span style={{ color: isAlert ? "#dc2626" : "#333" }}>{obs.description}</span>
                {obs.category && (
                  <span style={{
                    display: "inline-block",
                    fontSize: "7px",
                    color: "#8b8fa3",
                    backgroundColor: "#f1f3f5",
                    padding: "0 4px",
                    borderRadius: "2px",
                    marginLeft: "6px",
                    verticalAlign: "middle",
                  }}>
                    {CATEGORY_LABELS[obs.category] ?? obs.category}
                  </span>
                )}
                {obs.sourceObservationId && previousReportNumber && (
                  <span style={{ fontSize: "7px", color: "#9ca3af", marginLeft: "4px" }}>
                    (CR n°{previousReportNumber})
                  </span>
                )}
              </td>
              <td style={{ ...obsTdStyle, textAlign: "center", fontSize: "8px", color: isAlert ? "#dc2626" : "#666" }}>
                {obs.dueDate ? formatDate(obs.dueDate) : "\u2014"}
              </td>
              <td style={{
                ...obsTdStyle,
                textAlign: "center",
                fontSize: "8px",
                fontWeight: status.bold ? "bold" : "normal",
                color: status.color,
              }}>
                {status.text}
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
  fontWeight: "600",
  color: "#555",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  padding: "7px 8px",
  borderBottom: "2px solid #333",
  textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  padding: "5px 8px",
  borderBottom: "1px solid #eef0f2",
  verticalAlign: "top",
  fontSize: "9px",
};

const obsThStyle: React.CSSProperties = {
  fontSize: "8px",
  fontWeight: "600",
  color: "#555",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  padding: "6px 8px",
  borderBottom: "2px solid #333",
  textAlign: "left",
};

const obsTdStyle: React.CSSProperties = {
  padding: "5px 8px",
  borderBottom: "1px solid #eef0f2",
  verticalAlign: "top",
  fontSize: "9px",
};
