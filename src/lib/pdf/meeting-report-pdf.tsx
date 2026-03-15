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
  companies?: Company[];
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
  role?: string;
  phone?: string;
  email?: string;
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

// ─── Status rendering ───────────────────────────────────────────────
function getObsStatus(obs: Observation): { text: string; color: string; bold: boolean } {
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
  pageHeader: {
    marginBottom: 16,
  },
  headerLogo: {
    maxHeight: 35,
    maxWidth: 130,
    objectFit: "contain" as const,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#222",
    paddingBottom: 5,
    marginBottom: 8,
    marginTop: 18,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  // Attendance table
  thRow: { flexDirection: "row" },
  thCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#555",
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
    padding: "6px 6px",
  },
  tRow: { flexDirection: "row" },
  tRowAlt: { backgroundColor: "#fafbfc" },
  tCell: {
    fontSize: 9,
    padding: "4px 6px",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eef0f2",
  },
  // Company section header
  companyHeader: {
    borderLeftWidth: 4,
    backgroundColor: "#f8fafc",
    padding: "8px 14px",
    marginTop: 20,
    marginBottom: 8,
    borderRadius: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // Observations table
  obsThRow: { flexDirection: "row" },
  obsThCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#555",
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
    padding: "5px 6px",
  },
  obsRow: { flexDirection: "row" },
  obsRowAlt: { backgroundColor: "#fafbfc" },
  obsCell: {
    fontSize: 9,
    padding: "4px 6px",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eef0f2",
  },
  obsCatTag: {
    fontSize: 6.5,
    color: "#8b8fa3",
    backgroundColor: "#f1f3f5",
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderRadius: 1,
    marginLeft: 4,
  },
  obsEmpty: {
    fontSize: 9,
    padding: "5px 8px",
    color: "#bbb",
    fontStyle: "italic" as const,
  },
  // Next meeting
  nextMeeting: {
    borderLeftWidth: 4,
    backgroundColor: "#f8fafc",
    padding: "8px 14px",
    marginBottom: 16,
    borderRadius: 2,
  },
  // Legend
  legend: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
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
  attBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
    textAlign: "center" as const,
  },
});

// ─── PDF Document ───────────────────────────────────────────────────
export function MeetingReportPDF({
  report,
  companies: allCompanies,
  projectName,
  previousReportNumber,
  pdfSettings,
}: Props) {
  const accent = pdfSettings?.headerColor || "#2563eb";
  const companyName = pdfSettings?.companyName || "";
  const crDate = formatDate(report.date);
  const footerLeft = pdfSettings?.footerText || companyName || projectName;
  const footerCenter = `CR n\u00b0${report.number} \u2014 ${crDate}`;
  const pdfFont = pdfSettings?.fontFamily || "Helvetica";
  const pdfFontBold = pdfFont === "Times-Roman" ? "Times-Bold" : pdfFont === "Courier" ? "Courier-Bold" : "Helvetica-Bold";
  const showContacts = pdfSettings?.showContacts !== false;
  const showConvocation = pdfSettings?.showConvocation !== false;

  const attWidths = { ...DEFAULT_ATTENDANCE_WIDTHS, ...pdfSettings?.columnWidths?.attendance };

  // Build full attendance list: all companies with their attendance status
  const sortedAttendances = (() => {
    if (allCompanies && allCompanies.length > 0) {
      const attendanceMap = new Map(
        report.attendances.map((att) => [att.company.id, att])
      );
      const merged: Attendance[] = allCompanies.map((company) => {
        const existing = attendanceMap.get(company.id);
        if (existing) return existing;
        return { status: "non_convoque", representant: "", company };
      });
      return sortByLotNumber(merged, (att) => att.company);
    }
    return sortByLotNumber(report.attendances, (att) => att.company);
  })();
  const sortedSections = sortByLotNumber(report.sections, (sec) => sec.company);
  const generalObs = report.observations.filter((o) => !o.companyId);

  return (
    <Document>
      {/* ═══════════ COVER PAGE ═══════════ */}
      {pdfSettings?.showCoverPage && (
        <Page size="A4" style={[s.coverPage, { fontFamily: pdfFont }]}>
          <View style={s.coverTop}>
            {pdfSettings.logoUrl && (
              <Image src={pdfSettings.logoUrl} style={{ maxHeight: 70, maxWidth: 180, objectFit: "contain" as const }} />
            )}
            {(companyName || pdfSettings.companyAddress) && (
              <View style={s.coverCompanyInfo}>
                {companyName ? <Text style={[s.coverCompanyName, { fontFamily: pdfFontBold }]}>{companyName}</Text> : null}
                {pdfSettings.companyAddress ? <Text style={{ marginTop: 2 }}>{pdfSettings.companyAddress}</Text> : null}
              </View>
            )}
          </View>

          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <View style={{ width: 50, height: 3, backgroundColor: accent, marginBottom: 20 }} />
            <Text style={{ fontSize: 22, fontFamily: pdfFontBold, color: "#222", letterSpacing: 2, textTransform: "uppercase" as const }}>
              {pdfSettings.coverTitle || "Compte-rendu"}
            </Text>
            <Text style={{ fontSize: 14, color: "#555", marginTop: 6 }}>
              {pdfSettings.coverSubtitle || "R\u00e9union de chantier"}
            </Text>
            <View style={{ width: 35, height: 2, backgroundColor: accent, marginVertical: 14 }} />
            <Text style={{ fontSize: 12, color: "#444" }}>{formatDateLong(report.date)}</Text>

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

            <View style={{ backgroundColor: accent, paddingHorizontal: 16, paddingVertical: 5, marginTop: 16, borderRadius: 2 }}>
              <Text style={{ fontSize: 11, fontFamily: pdfFontBold, color: "#ffffff", letterSpacing: 1 }}>
                CR N\u00b0{report.number}
              </Text>
            </View>

            {pdfSettings.sitePhotoUrl ? (
              <Image src={pdfSettings.sitePhotoUrl} style={{ marginTop: 30, maxHeight: 190, maxWidth: 340, objectFit: "cover" as const, borderRadius: 4 }} />
            ) : null}
          </View>

          <Text style={{ fontSize: 9, color: "#aaa", textAlign: "center" as const }}>
            {`\u00c9dit\u00e9 le ${new Date().toLocaleDateString("fr-FR")}`}
          </Text>
        </Page>
      )}

      {/* ═══════════ CONTENT PAGES ═══════════ */}
      <Page size="A4" style={[s.page, { fontFamily: pdfFont }]} wrap>
        {pdfSettings?.logoUrl && (
          <View style={s.pageHeader} fixed>
            <Image src={pdfSettings.logoUrl} style={s.headerLogo} />
          </View>
        )}

        {/* ─── Attendance ─── */}
        <SectionTitlePdf color={accent} fontBold={pdfFontBold}>Pr{"\u00e9"}sences</SectionTitlePdf>

        <View style={[s.thRow, { borderBottomWidth: 2, borderBottomColor: accent }]}>
          <Text style={[s.thCell, { width: attWidths.designation }]}>Lot</Text>
          <Text style={[s.thCell, { width: attWidths.societe }]}>Entreprise</Text>
          <Text style={[s.thCell, { width: attWidths.nom }]}>Repr{"\u00e9"}sentant</Text>
          <Text style={[s.thCell, { width: attWidths.presence, textAlign: "center" }]}>Pr{"\u00e9"}s.</Text>
          {showConvocation && (
            <Text style={[s.thCell, { width: attWidths.convocation, textAlign: "center" }]}>Conv.</Text>
          )}
        </View>

        {sortedAttendances.map((att, i) => {
          const contacts = parseContacts(att.company.contacts);
          const lotDisplay = att.company.lotNumber ? `Lot ${att.company.lotNumber}` : "\u2014";
          const isAlt = i % 2 === 1;

          return (
            <View key={i} style={[s.tRow, isAlt ? s.tRowAlt : {}]}>
              <View style={[s.tCell, { width: attWidths.designation }]}>
                <Text style={{ fontFamily: pdfFontBold, fontSize: 9 }}>{lotDisplay}</Text>
                {att.company.lotLabel ? <Text style={{ fontSize: 8, color: "#666" }}>{att.company.lotLabel}</Text> : null}
              </View>
              <Text style={[s.tCell, { width: attWidths.societe, fontFamily: pdfFontBold }]}>{att.company.name}</Text>
              <View style={[s.tCell, { width: attWidths.nom }]}>
                {contacts.length > 0 ? contacts.map((contact, ci) => (
                  <View key={ci} style={ci > 0 ? { marginTop: 2, borderTopWidth: 0.5, borderTopColor: "#eee", paddingTop: 1 } : {}}>
                    <Text style={{ fontSize: 9 }}>
                      {contact.name}
                      {contact.role ? <Text style={{ fontSize: 7, color: "#888" }}> ({contact.role})</Text> : null}
                    </Text>
                    {showContacts && (contact.phone || contact.email) ? (
                      <Text style={{ fontSize: 7, color: "#888" }}>
                        {[contact.phone, contact.email].filter(Boolean).join(" \u2022 ")}
                      </Text>
                    ) : null}
                  </View>
                )) : (
                  <Text style={{ fontSize: 9 }}>{att.representant || "\u2014"}</Text>
                )}
              </View>
              <View style={[s.tCell, { width: attWidths.presence, alignItems: "center", justifyContent: "center" }]}>
                <View style={[s.attBadge, { backgroundColor: ATTENDANCE_COLORS[att.status] ?? "#999" }]}>
                  <Text style={{ fontSize: 7, fontFamily: pdfFontBold, color: "#ffffff" }}>
                    {ATTENDANCE_LABELS[att.status] ?? att.status}
                  </Text>
                </View>
              </View>
              {showConvocation && (
                <Text style={[s.tCell, { width: attWidths.convocation, textAlign: "center", fontSize: 8, color: "#555" }]}>
                  {att.status !== "non_convoque" ? "Oui" : "Non"}
                </Text>
              )}
            </View>
          );
        })}

        {/* Legend */}
        <View style={s.legend}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: "#16a34a" }} />
            <Text style={s.legendItem}>Pr{"\u00e9"}sent</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: "#dc2626" }} />
            <Text style={s.legendItem}>Absent</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: "#6b7280" }} />
            <Text style={s.legendItem}>Excus{"\u00e9"}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: "#9ca3af" }} />
            <Text style={s.legendItem}>Non convoqu{"\u00e9"}</Text>
          </View>
        </View>

        {/* ─── Next meeting ─── */}
        {report.nextMeetingDate && (
          <View style={[s.nextMeeting, { borderLeftColor: accent }]}>
            <Text style={{ fontSize: 10, color: "#333" }}>
              <Text style={{ fontFamily: pdfFontBold }}>Prochaine r{"\u00e9"}union : </Text>
              {formatDateLong(report.nextMeetingDate)}
              {report.nextMeetingTime && ` \u00e0 ${report.nextMeetingTime}`}
              {report.location && ` \u2014 ${report.location}`}
            </Text>
          </View>
        )}

        {/* ─── Généralités ─── */}
        {report.generalNotes && report.generalNotes !== "{}" && report.generalNotes !== '""' && (
          <>
            <SectionTitlePdf color={accent} fontBold={pdfFontBold}>G{"\u00e9"}n{"\u00e9"}ralit{"\u00e9"}s</SectionTitlePdf>
            <View style={{ marginBottom: 16 }}>
              {renderTiptapContent(report.generalNotes)}
            </View>
          </>
        )}

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
              <ObservationsTablePdf
                observations={sectionObs}
                previousReportNumber={previousReportNumber}
                color={accent}
                fontBold={pdfFontBold}
                font={pdfFont}
              />
            </View>
          );
        })}

        {/* ─── General observations ─── */}
        {generalObs.length > 0 && (
          <View>
            <SectionTitlePdf color={accent} fontBold={pdfFontBold}>Observations g{"\u00e9"}n{"\u00e9"}rales</SectionTitlePdf>
            <ObservationsTablePdf
              observations={generalObs}
              previousReportNumber={previousReportNumber}
              color={accent}
              fontBold={pdfFontBold}
              font={pdfFont}
            />
          </View>
        )}

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
  if (!company) return <SectionTitlePdf color={color} fontBold={fontBold}>{section.title}</SectionTitlePdf>;

  return (
    <View style={{
      borderBottomWidth: 2,
      borderBottomColor: color,
      paddingBottom: 5,
      marginTop: 20,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    }}>
      {company.lotNumber && (
        <Text style={{ fontSize: 12, fontFamily: fontBold, color: color }}>
          Lot {company.lotNumber}
        </Text>
      )}
      <Text style={{ fontSize: 12, fontFamily: fontBold, color: "#222" }}>
        {company.name}
      </Text>
      {company.lotLabel && (
        <Text style={{ fontSize: 10, color: "#666" }}>
          {"\u2014"} {company.lotLabel}
        </Text>
      )}
    </View>
  );
}

// ─── Single flat observations table ─────────────────────────────────
function ObservationsTablePdf({
  observations,
  previousReportNumber,
  color,
  fontBold = "Helvetica-Bold",
  font = "Helvetica",
}: {
  observations: Observation[];
  previousReportNumber: number | null;
  color: string;
  fontBold?: string;
  font?: string;
}) {
  if (observations.length === 0) {
    return (
      <View style={{ marginBottom: 8 }}>
        <Text style={s.obsEmpty}>Aucune observation</Text>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Table header */}
      <View style={[s.obsThRow, { borderBottomWidth: 2, borderBottomColor: color }]}>
        <Text style={[s.obsThCell, { width: "5%", textAlign: "center" }]}>#</Text>
        <Text style={[s.obsThCell, { flex: 1 }]}>Observation</Text>
        <Text style={[s.obsThCell, { width: "12%", textAlign: "center" }]}>{"\u00c9"}ch{"\u00e9"}ance</Text>
        <Text style={[s.obsThCell, { width: "14%", textAlign: "center" }]}>Statut</Text>
      </View>

      {/* Rows */}
      {observations.map((obs, i) => {
        const status = getObsStatus(obs);
        const isAlert = obs.status === "retard" || obs.status === "urgent";

        return (
          <View key={i} style={[s.obsRow, i % 2 === 1 ? s.obsRowAlt : {}]}>
            <Text style={[s.obsCell, { width: "5%", textAlign: "center", color: "#999", fontSize: 8 }]}>
              {i + 1}
            </Text>
            <View style={[s.obsCell, { flex: 1 }]}>
              <Text style={{ color: isAlert ? "#dc2626" : "#333" }}>
                {obs.description}
                {obs.category && (
                  <Text style={s.obsCatTag}> {CATEGORY_LABELS[obs.category] ?? obs.category}</Text>
                )}
                {obs.sourceObservationId && previousReportNumber && (
                  <Text style={{ fontSize: 7, color: "#9ca3af" }}> (CR n{"\u00b0"}{previousReportNumber})</Text>
                )}
              </Text>
            </View>
            <Text style={[s.obsCell, { width: "12%", textAlign: "center", fontSize: 8, color: isAlert ? "#dc2626" : "#666" }]}>
              {obs.dueDate ? formatDate(obs.dueDate) : "\u2014"}
            </Text>
            <Text style={[s.obsCell, {
              width: "14%",
              textAlign: "center",
              fontSize: 8,
              fontFamily: status.bold ? fontBold : font,
              color: status.color,
            }]}>
              {status.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
