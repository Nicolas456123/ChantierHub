import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    color: "#1a1a1a",
  },
  // Header
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
  // Status badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  // Section
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
  // Attendance table
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#666",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    fontSize: 9,
  },
  // Observations
  obsRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  obsDescription: {
    fontSize: 9,
    flex: 1,
  },
  obsStatus: {
    fontSize: 8,
    width: 60,
    textAlign: "center",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  obsDate: {
    fontSize: 8,
    color: "#666",
    width: 70,
    textAlign: "center",
  },
  obsBadge: {
    fontSize: 7,
    color: "#ea580c",
    marginLeft: 4,
  },
  // Content
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 4,
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
    marginBottom: 4,
  },
  heading3: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
    marginBottom: 3,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 2,
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
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#999",
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
    paddingTop: 6,
  },
  // Next meeting
  nextMeeting: {
    backgroundColor: "#eff6ff",
    padding: 10,
    borderRadius: 4,
    marginTop: 12,
    marginBottom: 12,
  },
  nextMeetingText: {
    fontSize: 10,
    color: "#1e40af",
  },
});
