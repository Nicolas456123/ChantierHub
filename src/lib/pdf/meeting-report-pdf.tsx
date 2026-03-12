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
  headerColor?: string;
  showCoverPage?: boolean;
  coverTitle?: string;
  coverSubtitle?: string;
  footerText?: string;
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

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  en_cours: { bg: "#dbeafe", color: "#1d4ed8" },
  fait: { bg: "#dcfce7", color: "#16a34a" },
  retard: { bg: "#fee2e2", color: "#dc2626" },
  urgent: { bg: "#ffedd5", color: "#ea580c" },
};

const ATTENDANCE_LABELS: Record<string, string> = {
  present: "Présent",
  absent: "Absent",
  excuse: "Excusé",
  non_convoque: "Non convoqué",
};

// ─── PDF Document ───────────────────────────────────────────────────
export function MeetingReportPDF({
  report,
  projectName,
  previousReportNumber,
  pdfSettings,
}: Props) {
  const today = new Date().toLocaleDateString("fr-FR");
  const headerColor = pdfSettings?.headerColor || "#1e3a5f";
  const footerText = pdfSettings?.footerText || `CR n°${report.number} — ${projectName}`;

  return (
    <Document>
      {/* Cover Page */}
      {pdfSettings?.showCoverPage && (
        <Page size="A4" style={[styles.page, { justifyContent: "center", alignItems: "center" }]}>
          {pdfSettings.logoUrl && (
            <Image
              src={pdfSettings.logoUrl}
              style={{ maxHeight: 100, maxWidth: 250, marginBottom: 40, objectFit: "contain" }}
            />
          )}
          <Text style={{ fontSize: 24, fontFamily: "Helvetica-Bold", color: headerColor, textAlign: "center", marginBottom: 10 }}>
            {pdfSettings.coverTitle || "Compte-rendu de réunion de chantier"}
          </Text>
          {pdfSettings.coverSubtitle && (
            <Text style={{ fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 }}>
              {pdfSettings.coverSubtitle}
            </Text>
          )}
          <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: headerColor, marginBottom: 6 }}>
            {projectName}
          </Text>
          <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
            CR n°{report.number}
          </Text>
          <Text style={{ fontSize: 12, color: "#666" }}>
            {formatDate(report.date)}
          </Text>
          {pdfSettings.companyName && (
            <Text style={{ fontSize: 10, color: "#999", marginTop: 40 }}>
              {pdfSettings.companyName}
            </Text>
          )}
        </Page>
      )}

      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: headerColor }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {pdfSettings?.logoUrl && !pdfSettings.showCoverPage && (
              <Image
                src={pdfSettings.logoUrl}
                style={{ maxHeight: 40, maxWidth: 100, objectFit: "contain" }}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: headerColor }]}>
                Compte-rendu de réunion n°{report.number}
              </Text>
              <Text style={styles.headerSubtitle}>{projectName}</Text>
            </View>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerInfoItem}>
              Date : {formatDate(report.date)}
            </Text>
            {report.location && (
              <Text style={styles.headerInfoItem}>
                Lieu : {report.location}
              </Text>
            )}
            {report.weather && (
              <Text style={styles.headerInfoItem}>
                Météo : {report.weather}
              </Text>
            )}
          </View>
        </View>

        {/* Next meeting */}
        {report.nextMeetingDate && (
          <View style={styles.nextMeeting}>
            <Text style={styles.nextMeetingText}>
              Prochaine réunion : {formatDate(report.nextMeetingDate)}
              {report.nextMeetingTime && ` à ${report.nextMeetingTime}`}
            </Text>
          </View>
        )}

        {/* Attendance table */}
        <Text style={styles.sectionTitle}>Liste de présence</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
              Entreprise
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Lot</Text>
            <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
              Statut
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "35%" }]}>
              Représentant
            </Text>
          </View>
          {report.attendances.map((att, i) => (
            <View
              key={i}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.tableCell, { width: "25%" }]}>
                {att.company.name}
              </Text>
              <Text style={[styles.tableCell, { width: "20%", color: "#666" }]}>
                {att.company.lotNumber
                  ? `Lot ${att.company.lotNumber}${
                      att.company.lotLabel ? ` — ${att.company.lotLabel}` : ""
                    }`
                  : "—"}
              </Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>
                {ATTENDANCE_LABELS[att.status] ?? att.status}
              </Text>
              <Text style={[styles.tableCell, { width: "35%" }]}>
                {att.representant || "—"}
              </Text>
            </View>
          ))}
        </View>

        {/* General notes */}
        <Text style={styles.sectionTitle}>Généralités</Text>
        {renderTiptapContent(report.generalNotes)}

        {/* Sections by company */}
        {report.sections.map((section) => {
          const sectionObs = report.observations.filter(
            (o) => o.companyId === section.company?.id
          );

          return (
            <View key={section.id} wrap={false}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {renderTiptapContent(section.content)}

              {sectionObs.length > 0 && (
                <View style={[styles.table, { marginTop: 6 }]}>
                  <View style={styles.tableHeader}>
                    <Text
                      style={[styles.tableHeaderCell, { flex: 1 }]}
                    >
                      Observation
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: 70 }]}>
                      Pour le
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: 70 }]}>
                      Fait le
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: 55 }]}>
                      Statut
                    </Text>
                  </View>
                  {sectionObs.map((obs, j) => {
                    const sc = STATUS_COLORS[obs.status] ?? {
                      bg: "#f3f4f6",
                      color: "#333",
                    };
                    return (
                      <View key={j} style={styles.obsRow}>
                        <View style={[styles.obsDescription, { flexDirection: "row", alignItems: "center" }]}>
                          <Text style={{ fontSize: 9 }}>
                            {obs.description}
                          </Text>
                          {obs.sourceObservationId && previousReportNumber && (
                            <Text style={styles.obsBadge}>
                              {" "}
                              (CR n°{previousReportNumber})
                            </Text>
                          )}
                        </View>
                        <Text style={styles.obsDate}>
                          {obs.dueDate ? formatDateShort(obs.dueDate) : "—"}
                        </Text>
                        <Text style={styles.obsDate}>
                          {obs.doneDate ? formatDateShort(obs.doneDate) : "—"}
                        </Text>
                        <Text
                          style={[
                            styles.obsStatus,
                            { backgroundColor: sc.bg, color: sc.color },
                          ]}
                        >
                          {STATUS_LABELS[obs.status] ?? obs.status}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* General observations (without company) */}
        {(() => {
          const generalObs = report.observations.filter((o) => !o.companyId);
          if (generalObs.length === 0) return null;
          return (
            <View>
              <Text style={styles.sectionTitle}>Observations générales</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>
                    Observation
                  </Text>
                  <Text style={[styles.tableHeaderCell, { width: 70 }]}>
                    Pour le
                  </Text>
                  <Text style={[styles.tableHeaderCell, { width: 70 }]}>
                    Fait le
                  </Text>
                  <Text style={[styles.tableHeaderCell, { width: 55 }]}>
                    Statut
                  </Text>
                </View>
                {generalObs.map((obs, j) => {
                  const sc = STATUS_COLORS[obs.status] ?? {
                    bg: "#f3f4f6",
                    color: "#333",
                  };
                  return (
                    <View key={j} style={styles.obsRow}>
                      <Text style={styles.obsDescription}>
                        {obs.description}
                      </Text>
                      <Text style={styles.obsDate}>
                        {obs.dueDate ? formatDateShort(obs.dueDate) : "—"}
                      </Text>
                      <Text style={styles.obsDate}>
                        {obs.doneDate ? formatDateShort(obs.doneDate) : "—"}
                      </Text>
                      <Text
                        style={[
                          styles.obsStatus,
                          { backgroundColor: sc.bg, color: sc.color },
                        ]}
                      >
                        {STATUS_LABELS[obs.status] ?? obs.status}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{footerText}</Text>
          <Text>Édité le {today}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
