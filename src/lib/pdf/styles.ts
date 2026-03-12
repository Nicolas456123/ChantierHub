import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 35,
    color: "#1a1a1a",
  },
  // Cover page
  coverPage: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 40,
    color: "#1a1a1a",
  },
  coverTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 40,
  },
  coverCompanyInfo: {
    fontSize: 9,
    color: "#444",
    lineHeight: 1.4,
  },
  coverCompanyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  coverTitleBox: {
    borderWidth: 3,
    padding: 25,
    alignItems: "center",
    marginBottom: 25,
    width: "80%",
  },
  coverTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textAlign: "center",
  },
  coverSubtitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    textAlign: "center",
  },
  coverDate: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    textAlign: "center",
  },
  coverProjectName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    marginBottom: 6,
  },
  coverProjectDesc: {
    fontSize: 11,
    color: "#555",
    marginBottom: 6,
    textAlign: "center",
  },
  coverSiteAddress: {
    fontSize: 10,
    color: "#666",
  },
  coverCrNumber: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
  },

  // Page header (logo repeated on each page)
  pageHeader: {
    marginBottom: 16,
  },
  headerLogo: {
    maxHeight: 35,
    maxWidth: 130,
    objectFit: "contain" as const,
  },

  // Section banner (colored background, white text)
  sectionBanner: {
    padding: "7px 14px",
    marginTop: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  sectionBannerText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },

  // Company section header (bordered box)
  companySectionHeader: {
    borderWidth: 2,
    padding: "10px 18px",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  companySectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    textAlign: "center",
  },

  // Tables
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    textTransform: "uppercase",
    padding: "5px 6px",
    borderWidth: 0.5,
    borderColor: "#333",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    fontSize: 9,
    padding: "3px 6px",
    borderWidth: 0.5,
    borderColor: "#999",
  },

  // Category row (observation category header in table)
  catRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
  },
  catLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    padding: "4px 8px",
    borderWidth: 0.5,
    borderColor: "#999",
  },
  catHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    padding: "4px 4px",
    borderWidth: 0.5,
    borderColor: "#999",
    textAlign: "center",
  },

  // Observation row
  obsRow: {
    flexDirection: "row",
  },
  obsDescription: {
    fontSize: 9,
    padding: "3px 8px 3px 18px",
    borderWidth: 0.5,
    borderColor: "#999",
    flex: 1,
  },
  obsDate: {
    fontSize: 8,
    color: "#666",
    width: "20%",
    textAlign: "center",
    padding: "3px 4px",
    borderWidth: 0.5,
    borderColor: "#999",
  },
  obsStatus: {
    fontSize: 8,
    width: "20%",
    textAlign: "center",
    padding: "3px 4px",
    borderWidth: 0.5,
    borderColor: "#999",
  },
  obsBadge: {
    fontSize: 7,
    color: "#ea580c",
    marginLeft: 4,
  },
  obsEmpty: {
    fontSize: 9,
    padding: "3px 8px 3px 18px",
    borderWidth: 0.5,
    borderColor: "#999",
    color: "#ccc",
  },

  // Content
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 2,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  italic: {
    fontFamily: "Helvetica-Oblique",
  },
  heading2: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    marginBottom: 3,
  },
  heading3: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
    marginBottom: 3,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 1,
    paddingLeft: 8,
  },
  listBullet: {
    width: 12,
    fontSize: 10,
  },
  listContent: {
    flex: 1,
    fontSize: 10,
  },

  // Next meeting
  nextMeeting: {
    borderWidth: 2,
    padding: 9,
    marginBottom: 14,
    alignItems: "center",
  },
  nextMeetingText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },

  // Attendance legend
  legend: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  legendItem: {
    fontSize: 7.5,
    color: "#888",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 35,
    right: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#666",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 6,
  },

  // Old styles kept for compat
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  headerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  headerInfoItem: {
    fontSize: 9,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});
