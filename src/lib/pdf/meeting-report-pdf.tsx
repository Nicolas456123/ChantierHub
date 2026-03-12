import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { renderTiptapContent } from "./tiptap-to-pdf";

// ─── Types ──────────────────────────────────────────────────────────
interface Company {
  id: string;
  name: string;
  lotNumber: string | null;
  lotLabel: string | null;
  contacts?: string;
}

interface Attendance {
  status: string;
  representant: string;
  company: Company;
}

interface Section {
  id: string;
  title: string;
  content: string;
  company: Company | null;
}

interface Observation {
  description: string;
  category: string | null;
  dueDate: string | null;
  doneDate: string | null;
  status: string;
  companyId: string | null;
  sourceObservationId: string | null;
}

interface MeetingReportData {
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
  report: MeetingReportData;
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
  excuse: "#888",
  non_convoque: "#999",
};

const CATEGORY_LABELS: Record<string, string> = {
  administratif: "Administratif",
  etudes: "\u00c9tudes",
  controle: "Bureau de contr\u00f4le",
  avancement: "Avancement / Pr\u00e9visions",
  visite: "Visite de chantier",
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
  societe: "20%",
  nom: "28%",
  presence: "12%",
  convocation: "15%",
};

const DEFAULT_OBSERVATION_WIDTHS = {
  description: "60%",
  pourLe: "20%",
  faitLe: "20%",
};

// ─── PDF Styles ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 35,
    color: "#222",
  },
  coverPage: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: "40px 50px",
    color: "#222",
  },
  // Cover
  coverTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 60,
  },
  coverCompanyInfo: {
    fontSize: 9,
    color: "#555",
    lineHeight: 1.5,
  },
  coverCompanyName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#333",
  },
  // Page header
  pageHeader: {
    marginBottom: 16,
  },
  headerLogo: {
    maxHeight: 35,
    maxWidth: 130,
    objectFit: "contain" as const,
  },
  // Section title (colored underline)
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#222",
    paddingBottom: 5,
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  // Tables
  thRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#333",
  },
  thCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#555",
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
    padding: "5px 6px",
  },
  tRow: {
    flexDirection: "row",
  },
  tRowAlt: {
    backgroundColor: "#f9fafb",
  },
  tCell: {
    fontSize: 9,
    padding: "3px 6px",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  // Company section header
  companyHeader: {
    borderLeftWidth: 4,
    backgroundColor: "#f8f9fa",
    padding: "8px 14px",
    marginTop: 18,
    marginBottom: 8,
  },
  companyHeaderText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    lineHeight: 1.4,
  },
  companyHeaderSub: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    lineHeight: 1.4,
  },
  // Category rows
  catRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
  },
  catLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    padding: "4px 8px",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  catHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#555",
    padding: "4px 4px",
    textAlign: "center" as const,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  // Observation rows
  obsRow: {
    flexDirection: "row",
  },
  obsDesc: {
    fontSize: 9,
    padding: "3px 6px 3px 14px",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    flex: 1,
  },
  obsDate: {
    fontSize: 8,
    color: "#888",
    width: "20%",
    textAlign: "center" as const,
    padding: "3px 4px",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  obsStatus: {
    fontSize: 8,
    width: "20%",
    textAlign: "center" as const,
    padding: "3px 4px",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  obsBadge: {
    fontSize: 7,
    color: "#9ca3af",
  },
  obsEmpty: {
    fontSize: 9,
    padding: "3px 6px 3px 14px",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    color: "#d1d5db",
  },
  // Next meeting
  nextMeeting: {
    borderLeftWidth: 4,
    backgroundColor: "#f8f9fa",
    padding: "8px 14px",
    marginBottom: 16,
  },
  // Legend
  legend: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  legendItem: {
    fontSize: 7.5,
    color: "#999",
  },
  // Footer
  footer: {
    position: "absolute" as const,
    bottom: 20,
    left: 35,
    right: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#999",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
});

// ─── PDF Document ───────────────────────────────────────────────────
export function MeetingReportPDF({
  report,
  projectName,
  previousReportNumber,
  pdfSettings,
}: Props) {
  const accent = pdfSettings?.headerColor || "#2563eb";
  const companyName = pdfSettings?.companyName || "";
  const crDate = formatDate(report.date);
  const footerLeft = pdfSettings?.footerText || companyName || projectName;
  const footerCenter = `Compte-rendu du ${crDate}`;
  const pdfFont = pdfSettings?.fontFamily || "Helvetica";
  const pdfFontBold = pdfFont === "Times-Roman" ? "Times-Bold" : pdfFont === "Courier" ? "Courier-Bold" : "Helvetica-Bold";
  const showContacts = pdfSettings?.showContacts !== false;
  const showConvocation = pdfSettings?.showConvocation !== false;
  const visibleCategories = pdfSettings?.visibleCategories ?? CATEGORY_ORDER;

  const attWidths = { ...DEFAULT_ATTENDANCE_WIDTHS, ...pdfSettings?.columnWidths?.attendance };
  const obsWidths = { ...DEFAULT_OBSERVATION_WIDTHS, ...pdfSettings?.columnWidths?.observations };

  const sortedAttendances = sortByLotNumber(report.attendances, (att) => att.company);
  const sortedSections = sortByLotNumber(report.sections, (sec) => sec.company);
  const generalObs = report.observations.filter((o) => !o.companyId);

  return (
    <Document>
      {/* ═══════════ COVER PAGE ═══════════ */}
      {pdfSettings?.showCoverPage && (
        <Page size="A4" style={[s.coverPage, { fontFamily: pdfFont }]}>
          {/* Top: Logo + Company Info */}
          <View style={s.coverTop}>
            {pdfSettings.logoUrl && (
              <Image
                src={pdfSettings.logoUrl}
                style={{ maxHeight: 70, maxWidth: 180, objectFit: "contain" as const }}
              />
            )}
            {(companyName || pdfSettings.companyAddress) && (
              <View style={s.coverCompanyInfo}>
                {companyName ? <Text style={[s.coverCompanyName, { fontFamily: pdfFontBold }]}>{companyName}</Text> : null}
                {pdfSettings.companyAddress ? <Text style={{ marginTop: 2 }}>{pdfSettings.companyAddress}</Text> : null}
              </View>
            )}
          </View>

          {/* Center content */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {/* Decorative line */}
            <View style={{ width: 50, height: 3, backgroundColor: accent, marginBottom: 20 }} />

            <Text style={{ fontSize: 22, fontFamily: pdfFontBold, color: "#222", letterSpacing: 2, textTransform: "uppercase" as const }}>
              {pdfSettings.coverTitle || "Compte-rendu"}
            </Text>
            <Text style={{ fontSize: 14, color: "#555", marginTop: 6 }}>
              {pdfSettings.coverSubtitle || "R\u00e9union de chantier"}
            </Text>
            <View style={{ width: 35, height: 2, backgroundColor: accent, marginVertical: 14 }} />
            <Text style={{ fontSize: 12, color: "#444" }}>
              {formatDateLong(report.date)}
            </Text>

            {/* Project Info */}
            <Text style={{ fontSize: 16, fontFamily: pdfFontBold, color: "#222", marginTop: 28, marginBottom: 6 }}>
              {projectName}
            </Text>
            {pdfSettings.projectDescription ? (
              <Text style={{ fontSize: 10, color: "#666", marginBottom: 4, textAlign: "center" as const, maxWidth: 350 }}>
                {pdfSettings.projectDescription}
              </Text>
            ) : null}
            {pdfSettings.siteAddress ? (
              <Text style={{ fontSize: 9, color: "#888" }}>{pdfSettings.siteAddress}</Text>
            ) : null}

            {/* CR number badge */}
            <View style={{ backgroundColor: accent, paddingHorizontal: 16, paddingVertical: 5, marginTop: 16 }}>
              <Text style={{ fontSize: 11, fontFamily: pdfFontBold, color: "#ffffff", letterSpacing: 1 }}>
                CR N\u00b0{report.number}
              </Text>
            </View>

            {/* Site Photo */}
            {pdfSettings.sitePhotoUrl ? (
              <Image
                src={pdfSettings.sitePhotoUrl}
                style={{ marginTop: 30, maxHeight: 190, maxWidth: 340, objectFit: "cover" as const }}
              />
            ) : null}
          </View>

          <Text style={{ fontSize: 9, color: "#aaa", textAlign: "center" as const }}>
            {`\u00c9dit\u00e9 le ${new Date().toLocaleDateString("fr-FR")}`}
          </Text>
        </Page>
      )}

      {/* ═══════════ CONTENT PAGES ═══════════ */}
      <Page size="A4" style={[s.page, { fontFamily: pdfFont }]} wrap>
        {/* Page header with logo (fixed on every page) */}
        {pdfSettings?.logoUrl && (
          <View style={s.pageHeader} fixed>
            <Image src={pdfSettings.logoUrl} style={s.headerLogo} />
          </View>
        )}

        {/* ─── Attendance ─── */}
        <SectionTitlePdf color={accent} fontBold={pdfFontBold}>Liste de pr\u00e9sence</SectionTitlePdf>

        {/* Attendance table header */}
        <View style={s.thRow}>
          <Text style={[s.thCell, { width: attWidths.designation }]}>D\u00e9signation</Text>
          <Text style={[s.thCell, { width: attWidths.societe }]}>Soci\u00e9t\u00e9</Text>
          <Text style={[s.thCell, { width: attWidths.nom }]}>Nom / Contact</Text>
          <Text style={[s.thCell, { width: attWidths.presence, textAlign: "center" }]}>Pr\u00e9s.</Text>
          {showConvocation && (
            <Text style={[s.thCell, { width: attWidths.convocation, textAlign: "center" }]}>Conv.</Text>
          )}
        </View>

        {/* Attendance rows */}
        {sortedAttendances.map((att, i) => {
          const contacts = parseContacts(att.company.contacts);
          const designation = att.company.lotNumber
            ? `Lot ${att.company.lotNumber}${att.company.lotLabel ? ` \u2014 ${att.company.lotLabel}` : ""}`
            : att.company.lotLabel || "\u2014";
          const isAlt = i % 2 === 1;

          return (
            <View key={i} style={[s.tRow, isAlt ? s.tRowAlt : {}]}>
              <Text style={[s.tCell, { width: attWidths.designation }]}>{designation}</Text>
              <Text style={[s.tCell, { width: attWidths.societe, fontFamily: pdfFontBold }]}>{att.company.name}</Text>
              <View style={[s.tCell, { width: attWidths.nom }]}>
                <Text style={{ fontSize: 9 }}>
                  {att.representant || (contacts.length > 0 ? contacts[0].name : "\u2014")}
                </Text>
                {showContacts && contacts.length > 0 && contacts[0].phone ? (
                  <Text style={{ fontSize: 7, color: "#888" }}>{contacts[0].phone}</Text>
                ) : null}
                {showContacts && contacts.length > 0 && contacts[0].email ? (
                  <Text style={{ fontSize: 7, color: "#888" }}>{contacts[0].email}</Text>
                ) : null}
              </View>
              <Text style={[s.tCell, { width: attWidths.presence, textAlign: "center", fontFamily: pdfFontBold, color: ATTENDANCE_COLORS[att.status] ?? "#333" }]}>
                {ATTENDANCE_LABELS[att.status] ?? att.status}
              </Text>
              {showConvocation && (
                <Text style={[s.tCell, { width: attWidths.convocation, textAlign: "center", fontSize: 8, color: "#555" }]}>
                  {att.status !== "non_convoque" ? "Oui" : "Non"}
                </Text>
              )}
            </View>
          );
        })}

        {/* Attendance legend */}
        <View style={s.legend}>
          <Text style={s.legendItem}><Text style={{ fontFamily: pdfFontBold }}>P</Text> = Pr\u00e9sent</Text>
          <Text style={s.legendItem}><Text style={{ fontFamily: pdfFontBold }}>A</Text> = Absent</Text>
          <Text style={s.legendItem}><Text style={{ fontFamily: pdfFontBold }}>E</Text> = Excus\u00e9</Text>
          <Text style={s.legendItem}><Text style={{ fontFamily: pdfFontBold }}>NC</Text> = Non convoqu\u00e9</Text>
        </View>

        {/* ─── Next meeting ─── */}
        {report.nextMeetingDate && (
          <View style={[s.nextMeeting, { borderLeftColor: accent }]}>
            <Text style={{ fontSize: 10, color: "#333" }}>
              <Text style={{ fontFamily: pdfFontBold }}>Prochaine r\u00e9union : </Text>
              {formatDateLong(report.nextMeetingDate)}
              {report.nextMeetingTime && ` \u00e0 ${report.nextMeetingTime}`}
              {report.location && ` \u2014 ${report.location}`}
            </Text>
          </View>
        )}

        {/* ─── Généralités ─── */}
        <SectionTitlePdf color={accent} fontBold={pdfFontBold}>G\u00e9n\u00e9ralit\u00e9s</SectionTitlePdf>
        <View style={{ marginBottom: 16 }}>
          {renderTiptapContent(report.generalNotes)}
        </View>

        {/* ─── Company Sections ─── */}
        {sortedSections.map((section) => {
          const sectionObs = report.observations.filter(
            (o) => o.companyId === section.company?.id
          );

          return (
            <View key={section.id} wrap={false}>
              <CompanySectionHeaderPdf section={section} color={accent} fontBold={pdfFontBold} />
              {section.content && section.content !== "{}" && (
                <View style={{ marginBottom: 6 }}>
                  {renderTiptapContent(section.content)}
                </View>
              )}
              <ObservationsCategoryTablePdf
                observations={sectionObs}
                previousReportNumber={previousReportNumber}
                obsWidths={obsWidths}
                color={accent}
                visibleCategories={visibleCategories}
                fontBold={pdfFontBold}
                font={pdfFont}
              />
            </View>
          );
        })}

        {/* ─── General observations ─── */}
        {generalObs.length > 0 && (
          <View>
            <SectionTitlePdf color={accent} fontBold={pdfFontBold}>Observations g\u00e9n\u00e9rales</SectionTitlePdf>
            <ObservationsCategoryTablePdf
              observations={generalObs}
              previousReportNumber={previousReportNumber}
              obsWidths={obsWidths}
              color={accent}
              visibleCategories={visibleCategories}
              fontBold={pdfFontBold}
              font={pdfFont}
            />
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text>{footerLeft}</Text>
          <Text>{footerCenter}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function SectionTitlePdf({ children, color, fontBold = "Helvetica-Bold" }: { children: React.ReactNode; color: string; fontBold?: string }) {
  return (
    <View style={[s.sectionTitle, { borderBottomWidth: 2, borderBottomColor: color }]}>
      <Text style={{ fontSize: 11, fontFamily: fontBold, color: "#222", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
        {children}
      </Text>
    </View>
  );
}

function CompanySectionHeaderPdf({ section, color, fontBold = "Helvetica-Bold" }: { section: Section; color: string; fontBold?: string }) {
  const company = section.company;
  if (!company) {
    return <SectionTitlePdf color={color} fontBold={fontBold}>{section.title}</SectionTitlePdf>;
  }

  const parts: string[] = [];
  if (company.lotNumber) parts.push(`Lot ${company.lotNumber}`);
  if (company.lotLabel) parts.push(company.lotLabel.toUpperCase());
  parts.push(company.name.toUpperCase());

  return (
    <View style={[s.companyHeader, { borderLeftColor: color }]}>
      {parts.map((part, i) => (
        <Text key={i} style={[i === 0 && company.lotNumber ? s.companyHeaderText : s.companyHeaderSub, { fontFamily: fontBold }]}>
          {part}
        </Text>
      ))}
    </View>
  );
}

function ObservationsCategoryTablePdf({
  observations,
  previousReportNumber,
  obsWidths,
  color,
  visibleCategories,
  fontBold = "Helvetica-Bold",
  font = "Helvetica",
}: {
  observations: Observation[];
  previousReportNumber: number | null;
  obsWidths: { description: string; pourLe: string; faitLe: string };
  color: string;
  visibleCategories?: string[];
  fontBold?: string;
  font?: string;
}) {
  const filteredCategories = visibleCategories && visibleCategories.length > 0
    ? CATEGORY_ORDER.filter((cat) => visibleCategories.includes(cat))
    : CATEGORY_ORDER;

  const obsByCategory: Record<string, Observation[]> = {};
  for (const cat of filteredCategories) obsByCategory[cat] = [];
  obsByCategory["_other"] = [];

  for (const obs of observations) {
    const cat = obs.category && filteredCategories.includes(obs.category) ? obs.category : "_other";
    obsByCategory[cat].push(obs);
  }

  let catIndex = 0;
  return (
    <View style={{ marginBottom: 8 }}>
      {filteredCategories.map((cat) => {
        catIndex++;
        return (
          <CategoryRowsPdf
            key={cat}
            index={catIndex}
            label={CATEGORY_LABELS[cat]}
            observations={obsByCategory[cat]}
            previousReportNumber={previousReportNumber}
            obsWidths={obsWidths}
            color={color}
            fontBold={fontBold}
            font={font}
          />
        );
      })}
      {obsByCategory["_other"].length > 0 && (
        <CategoryRowsPdf
          index={catIndex + 1}
          label="Divers"
          observations={obsByCategory["_other"]}
          previousReportNumber={previousReportNumber}
          obsWidths={obsWidths}
          color={color}
          fontBold={fontBold}
          font={font}
        />
      )}
    </View>
  );
}

function CategoryRowsPdf({
  index,
  label,
  observations,
  previousReportNumber,
  obsWidths,
  color,
  fontBold = "Helvetica-Bold",
  font = "Helvetica",
}: {
  index: number;
  label: string;
  observations: Observation[];
  previousReportNumber: number | null;
  obsWidths: { description: string; pourLe: string; faitLe: string };
  color: string;
  fontBold?: string;
  font?: string;
}) {
  return (
    <View>
      {/* Category header row */}
      <View style={s.catRow}>
        <Text style={[s.catLabel, { width: obsWidths.description, borderLeftWidth: 3, borderLeftColor: color }]}>
          {index}. {label}
        </Text>
        <Text style={[s.catHeader, { width: obsWidths.pourLe }]}>Pour le</Text>
        <Text style={[s.catHeader, { width: obsWidths.faitLe }]}>Fait le</Text>
      </View>

      {/* Observation rows */}
      {observations.map((obs, j) => {
        const statusColor = STATUS_COLORS[obs.status] ?? "#333";
        const isRetardOrUrgent = obs.status === "retard" || obs.status === "urgent";

        return (
          <View key={j} style={s.obsRow}>
            <View style={[s.obsDesc, { color: isRetardOrUrgent ? "#dc2626" : "#333" }]}>
              <Text style={{ fontStyle: isRetardOrUrgent ? "italic" : "normal" }}>
                {obs.description}
                {obs.sourceObservationId && previousReportNumber && (
                  <Text style={s.obsBadge}> (CR n\u00b0{previousReportNumber})</Text>
                )}
              </Text>
            </View>
            <Text style={[s.obsDate, { color: isRetardOrUrgent ? "#dc2626" : "#888" }]}>
              {obs.dueDate ? formatDate(obs.dueDate) : ""}
            </Text>
            <Text style={[s.obsStatus, {
              fontFamily: isRetardOrUrgent ? fontBold : font,
              color: statusColor,
            }]}>
              {obs.status === "fait" && obs.doneDate
                ? formatDate(obs.doneDate)
                : STATUS_LABELS[obs.status] ?? ""}
            </Text>
          </View>
        );
      })}

      {/* Empty row */}
      {observations.length === 0 && (
        <View style={s.obsRow}>
          <Text style={[s.obsEmpty, { flex: 1 }]}>{"\u2014"}</Text>
          <Text style={s.obsDate}> </Text>
          <Text style={s.obsStatus}> </Text>
        </View>
      )}
    </View>
  );
}
