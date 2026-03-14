"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportCsvButtonProps {
  data: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  filename: string;
}

export function ExportCsvButton({ data, columns, filename }: ExportCsvButtonProps) {
  function handleExport() {
    if (data.length === 0) return;

    const header = columns.map((c) => c.label).join(";");
    const rows = data.map((row) =>
      columns
        .map((c) => {
          const val = row[c.key];
          if (val == null) return "";
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(";")
    );

    const bom = "\uFEFF"; // UTF-8 BOM for Excel
    const csv = bom + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (data.length === 0) return null;

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-1" />
      Exporter CSV
    </Button>
  );
}
