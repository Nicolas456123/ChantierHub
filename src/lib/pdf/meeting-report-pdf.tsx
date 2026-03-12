import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { styles } from "./styles";
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

const ATTENDANCE_COLORS: Record<string, string> = {
  present: "#16a34a",
  absent: "#dc2626",
  excuse: "#666",
  non_convoque: "#999",
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

// ─── PDF Document ───────────────────────────────────────────────────
export function MeetingReportPDF({
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

  const generalObs = report.observations.filter((o) => !o.companyId);

  return (
    <Document>
      {/* ═══════════ COVER PAGE ═══════════ */}
      {pdfSettings?.showCoverPage && (
        <Page size="A4" style={styles.coverPage}>
          {/* Top: Logo + Company Info */}
          <View style={styles.coverTop}>
            {pdfSettings.logoUrl && (
              <Image
                src={pdfSettings.logoUrl}
                style={{ maxHeight: 70, maxWidth: 180, objectFit: "contain" as const }}
              />
            )}
            {(companyName || pdfSettings.companyAddress) && (
              <View style={styles.coverCompanyInfo}>
                {companyName ? (
                  <Text style={styles.coverCompanyName}>{companyName}</Text>
                ) : null}
                {pdfSettings.companyAddress ? (
                  <Text style={{ marginTop: 2 }}>{pdfSettings.companyAddress}</Text>
                ) : null}
              </View>
            )}
          </View>

          {/* Center content */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {/* Title Box */}
            <View style={[styles.coverTitleBox, { borderColor: headerColor }]}>
              <Text style={[styles.coverTitle, { color: headerColor }]}>
                {pdfSettings.coverTitle || "COMPTE-RENDU"}
              </Text>
              <Text style={[styles.coverSubtitle, { color: headerColor }]}>
                {pdfSettings.coverSubtitle || "R\u00c9UNION DE CHANTIER"}
              </Text>
              <Text style={[styles.coverDate, { color: headerColor }]}>
                R\u00e9union du {formatDateLong(report.date)}
              </Text>
            </View>

            {/* Project Info */}
            <Text style={styles.coverProjectName}>{projectName}</Text>
            {pdfSettings.projectDescription ? (
              <Text style={styles.coverProjectDesc}>{pdfSettings.projectDescription}</Text>
            ) : null}
            {pdfSettings.siteAddress ? (
              <Text style={styles.coverSiteAddress}>{pdfSettings.siteAddress}</Text>
            ) : null}
            <Text style={styles.coverCrNumber}>CR n\u00b0{report.number}</Text>

            {/* Site Photo */}
            {pdfSettings.sitePhotoUrl ? (
              <Image
                src={pdfSettings.sitePhotoUrl}
                style={{
                  marginTop: 25,
                  maxHeight: 200,
                  maxWidth: 350,
                  objectFit: "cover" as const,
                }}
              />
            ) : null}
          </View>
        </Page>
      )}

      {/* ═══════════ CONTENT PAGES ═══════════ */}
      <Page size="A4" style={styles.page} wrap>
        {/* Page header with logo (fixed on every page) */}
        {pdfSettings?.logoUrl && (
          <View style={styles.pageHeader} fixed>
            <Image src={pdfSettings.logoUrl} style={styles.headerLogo} />
          </View>
        )}

        {/* ─── Attendance ─── */}
        <View style={[styles.sectionBanner, { backgroundColor: headerColor }]}>
          <Text style={styles.sectionBannerText}>LISTE DE PR\u00c9SENCE</Text>
        </View>

        {/* Attendance table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: "22%" }]}>D\u00e9signation</Text>
          <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Soci\u00e9t\u00e9</Text>
          <Text style={[styles.tableHeaderCell, { width: "28%" }]}>Nom</Text>
          <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "center" }]}>Pr\u00e9sence</Text>
          <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "center" }]}>Convocation</Text>
        </View>

        {/* Attendance rows */}
        {report.attendances.map((att, i) => {
          const contacts = parseContacts(att.company.contacts);
          const designation = att.company.lotNumber
            ? `Lot ${att.company.lotNumber}${att.company.lotLabel ? ` \u2014 ${att.company.lotLabel}` : ""}`
            : att.company.lotLabel || "\u2014";

          return (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: "22%" }]}>{designation}</Text>
              <Text style={[styles.tableCell, { width: "20%", fontFamily: "Helvetica-Bold" }]}>{att.company.name}</Text>
              <View style={[styles.tableCell, { width: "28%" }]}>
                <Text style={{ fontSize: 9 }}>
                  {att.representant || (contacts.length > 0 ? contacts[0].name : "\u2014")}
                </Text>
                {contacts.length > 0 && contacts[0].phone ? (
                  <Text style={{ fontSize: 7, color: "#666" }}>{contacts[0].phone}</Text>
                ) : null}
                {contacts.length > 0 && contacts[0].email ? (
                  <Text style={{ fontSize: 7, color: "#666" }}>{contacts[0].email}</Text>
                ) : null}
              </View>
              <Text style={[styles.tableCell, { width: "15%", textAlign: "center", fontFamily: "Helvetica-Bold", color: ATTENDANCE_COLORS[att.status] ?? "#333" }]}>
                {ATTENDANCE_LABELS[att.status] ?? att.status}
              </Text>
              <Text style={[styles.tableCell, { width: "15%", textAlign: "center", fontSize: 8 }]}>
                {att.status !== "non_convoque" ? "Oui" : "Non"}
              </Text>
            </View>
          );
        })}

        {/* Attendance legend */}
        <View style={styles.legend}>
          <Text style={styles.legendItem}><Text style={{ fontFamily: "Helvetica-Bold" }}>P</Text> = Pr\u00e9sent</Text>
          <Text style={styles.legendItem}><Text style={{ fontFamily: "Helvetica-Bold" }}>A</Text> = Absent</Text>
          <Text style={styles.legendItem}><Text style={{ fontFamily: "Helvetica-Bold" }}>E</Text> = Excus\u00e9</Text>
          <Text style={styles.legendItem}><Text style={{ fontFamily: "Helvetica-Bold" }}>NC</Text> = Non convoqu\u00e9</Text>
        </View>

        {/* ─── Next meeting ─── */}
        {report.nextMeetingDate && (
          <View style={[styles.nextMeeting, { borderColor: headerColor }]}>
            <Text style={[styles.nextMeetingText, { color: headerColor }]}>
              PROCHAINE R\u00c9UNION : {formatDateLong(report.nextMeetingDate).toUpperCase()}
              {report.nextMeetingTime && ` \u00c0 ${report.nextMeetingTime}`}
              {report.location && `  \u2014  ${report.location}`}
            </Text>
          </View>
        )}

        {/* ─── Généralités ─── */}
        <View style={[styles.sectionBanner, { backgroundColor: headerColor }]}>
          <Text style={styles.sectionBannerText}>G\u00c9N\u00c9RALIT\u00c9S</Text>
        </View>
        <View style={{ marginBottom: 16 }}>
          {renderTiptapContent(report.generalNotes)}
        </View>

        {/* ─── Company Sections ─── */}
        {report.sections.map((section) => {
          const sectionObs = report.observations.filter(
            (o) => o.companyId === section.company?.id
          );

          return (
            <View key={section.id} wrap={false}>
              <CompanySectionHeaderPdf section={section} color={headerColor} />
              {section.content && section.content !== "{}" && (
                <View style={{ marginBottom: 6 }}>
                  {renderTiptapContent(section.content)}
                </View>
              )}
              <ObservationsCategoryTablePdf
                observations={sectionObs}
                previousReportNumber={previousReportNumber}
              />
            </View>
          );
        })}

        {/* ─── General observations ─── */}
        {generalObs.length > 0 && (
          <View>
            <View style={[styles.sectionBanner, { backgroundColor: headerColor }]}>
              <Text style={styles.sectionBannerText}>OBSERVATIONS G\u00c9N\u00c9RALES</Text>
            </View>
            <ObservationsCategoryTablePdf
              observations={generalObs}
              previousReportNumber={previousReportNumber}
            />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{footerLeft}</Text>
          <Text>{footerCenter}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function CompanySectionHeaderPdf({ section, color }: { section: Section; color: string }) {
  const company = section.company;
  if (!company) {
    return (
      <View style={[styles.sectionBanner, { backgroundColor: color }]}>
        <Text style={styles.sectionBannerText}>{section.title}</Text>
      </View>
    );
  }

  const lotLine = company.lotNumber ? `LOT n\u00b0 ${company.lotNumber}` : null;
  const lotLabel = company.lotLabel || "";

  return (
    <View style={[styles.companySectionHeader, { borderColor: color }]}>
      {lotLine ? <Text style={styles.companySectionTitle}>{lotLine}</Text> : null}
      {lotLabel ? <Text style={styles.companySectionTitle}>{lotLabel}</Text> : null}
      <Text style={styles.companySectionTitle}>{company.name}</Text>
    </View>
  );
}

function ObservationsCategoryTablePdf({
  observations,
  previousReportNumber,
}: {
  observations: Observation[];
  previousReportNumber: number | null;
}) {
  const obsByCategory: Record<string, Observation[]> = {};
  for (const cat of CATEGORY_ORDER) obsByCategory[cat] = [];
  obsByCategory["_other"] = [];

  for (const obs of observations) {
    const cat = obs.category && CATEGORY_ORDER.includes(obs.category) ? obs.category : "_other";
    obsByCategory[cat].push(obs);
  }

  return (
    <View style={{ marginBottom: 10 }}>
      {CATEGORY_ORDER.map((cat, idx) => (
        <CategoryRowsPdf
          key={cat}
          index={idx + 1}
          label={CATEGORY_LABELS[cat]}
          observations={obsByCategory[cat]}
          previousReportNumber={previousReportNumber}
        />
      ))}
      {obsByCategory["_other"].length > 0 && (
        <CategoryRowsPdf
          index={6}
          label="DIVERS"
          observations={obsByCategory["_other"]}
          previousReportNumber={previousReportNumber}
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
}: {
  index: number;
  label: string;
  observations: Observation[];
  previousReportNumber: number | null;
}) {
  return (
    <View>
      {/* Category header row */}
      <View style={styles.catRow}>
        <Text style={[styles.catLabel, { width: "60%" }]}>
          {index}. {label}
        </Text>
        <Text style={[styles.catHeader, { width: "20%" }]}>Pour le :</Text>
        <Text style={[styles.catHeader, { width: "20%" }]}>Fait le :</Text>
      </View>

      {/* Observation rows */}
      {observations.map((obs, j) => {
        const statusColor = STATUS_COLORS[obs.status] ?? "#333";
        const isRetardOrUrgent = obs.status === "retard" || obs.status === "urgent";

        return (
          <View key={j} style={styles.obsRow}>
            <View style={[styles.obsDescription, { color: isRetardOrUrgent ? "#dc2626" : "#333" }]}>
              <Text style={{ fontStyle: isRetardOrUrgent ? "italic" : "normal" }}>
                {obs.description}
                {obs.sourceObservationId && previousReportNumber && (
                  <Text style={styles.obsBadge}> (CR n\u00b0{previousReportNumber})</Text>
                )}
              </Text>
            </View>
            <Text style={[styles.obsDate, { color: isRetardOrUrgent ? "#dc2626" : "#666" }]}>
              {obs.dueDate ? formatDate(obs.dueDate) : ""}
            </Text>
            <Text style={[styles.obsStatus, {
              fontFamily: isRetardOrUrgent ? "Helvetica-Bold" : "Helvetica",
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
        <View style={styles.obsRow}>
          <Text style={[styles.obsEmpty, { flex: 1 }]}> </Text>
          <Text style={styles.obsDate}> </Text>
          <Text style={styles.obsStatus}> </Text>
        </View>
      )}
    </View>
  );
}
