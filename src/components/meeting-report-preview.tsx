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

const STATUS_LABELS: Record<string, string> = {
  en_cours: "En cours",
  fait: "Fait",
  retard: "RETARD",
  urgent: "URGENT",
};

const STATUS_COLORS: Record<string, string> = {
  en_cours: "#2563eb",
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

const ATTENDANCE_COLORS: Record<string, string> = {
  present: "#16a34a",
  absent: "#dc2626",
  excuse: "#6b7280",
  non_convoque: "#9ca3af",
};

const CATEGORY_LABELS: Record<string, string> = {
  administratif: "Administratif",
  etudes: "\u00c9tudes",
  controle: "Contr\u00f4le",
  avancement: "Avancement",
  visite: "Visite",
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
  societe: "18%",
  nom: "30%",
  presence: "12%",
  convocation: "15%",
};

const DEFAULT_OBSERVATION_WIDTHS = {
  description: "60%",
  pourLe: "20%",
  faitLe: "20%",
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

// ─── Preview Component ──────────────────────────────────────────────
export function MeetingReportPreview({
  report,
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
  const visibleCategories = pdfSettings?.visibleCategories ?? CATEGORY_ORDER;

  const attWidths = { ...DEFAULT_ATTENDANCE_WIDTHS, ...pdfSettings?.columnWidths?.attendance };
  const obsWidths = { ...DEFAULT_OBSERVATION_WIDTHS, ...pdfSettings?.columnWidths?.observations };

  const sortedAttendances = useMemo(
    () => sortByLotNumber(report.attendances, (att) => att.company),
    [report.attendances]
  );

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
        <div style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "40px 50px",
          display: "flex",
          flexDirection: "column",
          borderBottom: "2px solid #e5e7eb",
          marginBottom: "20px",
          pageBreakAfter: "always",
          boxSizing: "border-box",
        }}>
          {/* Top: Logo + Company Info */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "60px" }}>
            {pdfSettings.logoUrl && (
              <img
                src={pdfSettings.logoUrl}
                alt="Logo"
                style={{ maxHeight: "70px", maxWidth: "180px", objectFit: "contain" }}
              />
            )}
            {(companyName || pdfSettings.companyAddress) && (
              <div style={{ fontSize: "9px", color: "#555", lineHeight: "1.5" }}>
                {companyName && <div style={{ fontWeight: "bold", fontSize: "10px", color: "#333" }}>{companyName}</div>}
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
            <div style={{ width: "60px", height: "3px", backgroundColor: accent, marginBottom: "24px" }} />

            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#222", letterSpacing: "2px", textTransform: "uppercase" }}>
                {pdfSettings.coverTitle || "Compte-rendu"}
              </div>
              <div style={{ fontSize: "15px", color: "#555", marginTop: "8px", fontWeight: "500" }}>
                {pdfSettings.coverSubtitle || "R\u00e9union de chantier"}
              </div>
              <div style={{ width: "40px", height: "2px", backgroundColor: accent, margin: "16px auto" }} />
              <div style={{ fontSize: "13px", color: "#444", marginTop: "8px" }}>
                {formatDateLong(report.date)}
              </div>
            </div>

            {/* Project Info */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#222", marginBottom: "8px" }}>
                {projectName}
              </div>
              {pdfSettings.projectDescription && (
                <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px", maxWidth: "380px", lineHeight: "1.5" }}>
                  {pdfSettings.projectDescription}
                </div>
              )}
              {pdfSettings.siteAddress && (
                <div style={{ fontSize: "10px", color: "#888" }}>
                  {pdfSettings.siteAddress}
                </div>
              )}
            </div>

            <div style={{
              display: "inline-block",
              padding: "6px 20px",
              backgroundColor: accent,
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "1px",
              borderRadius: "2px",
            }}>
              CR N°{report.number}
            </div>

            {/* Site Photo */}
            {pdfSettings.sitePhotoUrl && (
              <div style={{ marginTop: "36px" }}>
                <img
                  src={pdfSettings.sitePhotoUrl}
                  alt="Photo du chantier"
                  style={{
                    maxHeight: "220px",
                    maxWidth: "380px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
              </div>
            )}
          </div>

          {/* Bottom */}
          <div style={{ textAlign: "center", fontSize: "9px", color: "#aaa", paddingTop: "16px" }}>
            {`\u00c9dit\u00e9 le ${new Date().toLocaleDateString("fr-FR")}`}
          </div>
        </div>
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
            <img
              src={pdfSettings.logoUrl}
              alt="Logo"
              style={{ maxHeight: "35px", maxWidth: "130px", objectFit: "contain" }}
            />
          </div>
        )}

        {/* ─── Attendance Table ─── */}
        <SectionTitle color={accent}>Pr{"\u00e9"}sences</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px", fontSize: "9px" }}>
          <thead>
            <tr>
              <ResizableTh style={{ ...thStyle, width: attWidths.designation, borderBottom: `2px solid ${accent}` }} colKey="designation" tableType="attendance" onResize={onColumnResize}>Lot</ResizableTh>
              <ResizableTh style={{ ...thStyle, width: attWidths.societe, borderBottom: `2px solid ${accent}` }} colKey="societe" tableType="attendance" onResize={onColumnResize}>Entreprise</ResizableTh>
              <ResizableTh style={{ ...thStyle, width: attWidths.nom, borderBottom: `2px solid ${accent}` }} colKey="nom" tableType="attendance" onResize={onColumnResize}>Repr{"\u00e9"}sentant</ResizableTh>
              <ResizableTh style={{ ...thStyle, width: attWidths.presence, textAlign: "center", borderBottom: `2px solid ${accent}` }} colKey="presence" tableType="attendance" onResize={onColumnResize}>Pr{"\u00e9"}s.</ResizableTh>
              {showConvocation && (
                <ResizableTh style={{ ...thStyle, width: attWidths.convocation, textAlign: "center", borderBottom: `2px solid ${accent}` }} colKey="convocation" tableType="attendance" onResize={onColumnResize}>Conv.</ResizableTh>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedAttendances.map((att, i) => {
              const contacts = parseContacts(att.company.contacts);
              const lotDisplay = att.company.lotNumber
                ? `Lot ${att.company.lotNumber}`
                : "\u2014";
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
                    <span style={{ fontWeight: "500" }}>
                      {att.representant || (contacts.length > 0 ? contacts[0].name : "\u2014")}
                    </span>
                    {showContacts && contacts.length > 0 && contacts[0].phone && (
                      <span style={{ display: "block", fontSize: "7.5px", color: "#888" }}>
                        {contacts[0].phone}
                      </span>
                    )}
                    {showContacts && contacts.length > 0 && contacts[0].email && (
                      <span style={{ display: "block", fontSize: "7.5px", color: "#888" }}>
                        {contacts[0].email}
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

              <ObservationsCategoryTable
                observations={sectionObs}
                previousReportNumber={previousReportNumber}
                obsWidths={obsWidths}
                color={accent}
                visibleCategories={visibleCategories}
                onColumnResize={onColumnResize}
              />
            </div>
          );
        })}

        {/* ─── General observations ─── */}
        {generalObs.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <SectionTitle color={accent}>Observations g{"\u00e9"}n{"\u00e9"}rales</SectionTitle>
            <ObservationsCategoryTable
              observations={generalObs}
              previousReportNumber={previousReportNumber}
              obsWidths={obsWidths}
              color={accent}
              visibleCategories={visibleCategories}
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

// ─── Sub-components ─────────────────────────────────────────────────

function SectionTitle({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{
      fontSize: "12px",
      fontWeight: "bold",
      color: "#222",
      paddingBottom: "6px",
      borderBottom: `2px solid ${color}`,
      marginBottom: "10px",
      marginTop: "20px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }}>
      {children}
    </div>
  );
}

function CompanySectionHeader({ section, color }: { section: Section; color: string }) {
  const company = section.company;
  if (!company) {
    return <SectionTitle color={color}>{section.title}</SectionTitle>;
  }

  return (
    <div style={{
      borderLeft: `4px solid ${color}`,
      backgroundColor: "#f8fafc",
      padding: "10px 16px",
      marginBottom: "10px",
      marginTop: "22px",
      borderRadius: "0 4px 4px 0",
      display: "flex",
      alignItems: "baseline",
      gap: "10px",
    }}>
      {company.lotNumber && (
        <span style={{
          fontSize: "12px",
          fontWeight: "bold",
          color: color,
          whiteSpace: "nowrap",
        }}>
          Lot {company.lotNumber}
        </span>
      )}
      <div>
        <span style={{
          fontSize: "11px",
          fontWeight: "bold",
          color: "#222",
        }}>
          {company.name}
        </span>
        {company.lotLabel && (
          <span style={{
            fontSize: "10px",
            color: "#666",
            marginLeft: "8px",
          }}>
            {company.lotLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function ObservationsCategoryTable({
  observations,
  previousReportNumber,
  obsWidths,
  color,
  visibleCategories,
  onColumnResize,
}: {
  observations: Observation[];
  previousReportNumber: number | null;
  obsWidths: { description: string; pourLe: string; faitLe: string };
  color: string;
  visibleCategories?: string[];
  onColumnResize?: (table: "attendance" | "observations", key: string, value: string) => void;
}) {
  const filteredCategories = visibleCategories && visibleCategories.length > 0
    ? CATEGORY_ORDER.filter((cat) => visibleCategories.includes(cat))
    : CATEGORY_ORDER;

  const obsByCategory: Record<string, Observation[]> = {};
  for (const cat of filteredCategories) {
    obsByCategory[cat] = [];
  }
  obsByCategory["_other"] = [];

  for (const obs of observations) {
    const cat = obs.category && filteredCategories.includes(obs.category) ? obs.category : "_other";
    obsByCategory[cat].push(obs);
  }

  // Only show categories that have observations
  const nonEmptyCategories = filteredCategories.filter((cat) => obsByCategory[cat].length > 0);
  const hasOther = obsByCategory["_other"].length > 0;

  if (nonEmptyCategories.length === 0 && !hasOther) {
    return (
      <div style={{ fontSize: "9px", color: "#bbb", padding: "6px 0", fontStyle: "italic" }}>
        Aucune observation
      </div>
    );
  }

  let isFirstCategory = true;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px", marginBottom: "8px" }}>
      <tbody>
        {nonEmptyCategories.map((cat) => {
          const isFirst = isFirstCategory;
          isFirstCategory = false;
          return (
            <CategoryRows
              key={cat}
              label={CATEGORY_LABELS[cat]}
              observations={obsByCategory[cat]}
              previousReportNumber={previousReportNumber}
              obsWidths={obsWidths}
              color={color}
              onColumnResize={isFirst ? onColumnResize : undefined}
            />
          );
        })}
        {hasOther && (
          <CategoryRows
            label="Divers"
            observations={obsByCategory["_other"]}
            previousReportNumber={previousReportNumber}
            obsWidths={obsWidths}
            color={color}
            onColumnResize={nonEmptyCategories.length === 0 ? onColumnResize : undefined}
          />
        )}
      </tbody>
    </table>
  );
}

function CategoryRows({
  label,
  observations,
  previousReportNumber,
  obsWidths,
  color,
  onColumnResize,
}: {
  label: string;
  observations: Observation[];
  previousReportNumber: number | null;
  obsWidths: { description: string; pourLe: string; faitLe: string };
  color: string;
  onColumnResize?: (table: "attendance" | "observations", key: string, value: string) => void;
}) {
  return (
    <>
      {/* Category header row */}
      <tr>
        {onColumnResize ? (
          <>
            <ResizableTh
              style={{
                ...catHeaderStyle,
                borderLeft: `3px solid ${color}`,
                width: obsWidths.description,
              }}
              colKey="description"
              tableType="observations"
              onResize={onColumnResize}
            >
              {label}
            </ResizableTh>
            <ResizableTh
              style={{
                ...catHeaderDateStyle,
                width: obsWidths.pourLe,
              }}
              colKey="pourLe"
              tableType="observations"
              onResize={onColumnResize}
            >
              Pour le
            </ResizableTh>
            <ResizableTh
              style={{
                ...catHeaderDateStyle,
                width: obsWidths.faitLe,
              }}
              colKey="faitLe"
              tableType="observations"
              onResize={onColumnResize}
            >
              Fait le
            </ResizableTh>
          </>
        ) : (
          <>
            <td style={{
              ...catHeaderStyle,
              borderLeft: `3px solid ${color}`,
              width: obsWidths.description,
            }}>
              {label}
            </td>
            <td style={{ ...catHeaderDateStyle, width: obsWidths.pourLe }}>
              Pour le
            </td>
            <td style={{ ...catHeaderDateStyle, width: obsWidths.faitLe }}>
              Fait le
            </td>
          </>
        )}
      </tr>
      {/* Observation rows */}
      {observations.map((obs) => {
        const statusColor = STATUS_COLORS[obs.status] ?? "#333";
        const isRetardOrUrgent = obs.status === "retard" || obs.status === "urgent";
        return (
          <tr key={obs.id}>
            <td style={{
              ...tdStyle,
              width: obsWidths.description,
              padding: "5px 8px 5px 16px",
              color: isRetardOrUrgent ? "#dc2626" : "#333",
            }}>
              {obs.description}
              {obs.sourceObservationId && previousReportNumber && (
                <span style={{ fontSize: "7px", color: "#9ca3af", marginLeft: "4px" }}>
                  (CR n°{previousReportNumber})
                </span>
              )}
            </td>
            <td style={{
              ...tdStyle,
              width: obsWidths.pourLe,
              textAlign: "center",
              fontSize: "8px",
              color: isRetardOrUrgent ? "#dc2626" : "#888",
            }}>
              {obs.dueDate ? formatDate(obs.dueDate) : ""}
            </td>
            <td style={{
              ...tdStyle,
              width: obsWidths.faitLe,
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
    </>
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

const catHeaderStyle: React.CSSProperties = {
  fontWeight: "bold",
  fontSize: "9px",
  backgroundColor: "#f1f5f9",
  padding: "6px 8px",
  borderBottom: "1px solid #e2e8f0",
};

const catHeaderDateStyle: React.CSSProperties = {
  fontSize: "8px",
  fontWeight: "600",
  color: "#64748b",
  textAlign: "center",
  backgroundColor: "#f1f5f9",
  padding: "6px 4px",
  borderBottom: "1px solid #e2e8f0",
};
