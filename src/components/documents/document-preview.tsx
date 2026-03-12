"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileIcon, Loader2 } from "lucide-react";

interface DocumentPreviewProps {
  documentId: string;
  mimeType: string;
  fileName: string;
}

function isDocx(mimeType: string) {
  return mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

function isExcel(mimeType: string) {
  return (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  );
}

function ImagePreview({ url, fileName }: { url: string; fileName: string }) {
  return (
    <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={fileName}
        className="max-w-full max-h-[80vh] object-contain rounded"
      />
    </div>
  );
}

function PdfPreview({ url }: { url: string }) {
  return (
    <iframe
      src={url}
      className="w-full rounded-lg border"
      style={{ height: "80vh" }}
      title="Aperçu PDF"
    />
  );
}

function TextPreview({ url }: { url: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((res) => res.text())
      .then((text) => setContent(text.slice(0, 100000)))
      .catch(() => setContent("Erreur lors du chargement du fichier"))
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) return <LoadingState />;

  return (
    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[80vh] text-sm font-mono whitespace-pre-wrap">
      {content}
    </pre>
  );
}

function DocxPreview({ url }: { url: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function convert() {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtml(result.value);
      } catch {
        setError("Impossible de prévisualiser ce document Word");
      } finally {
        setLoading(false);
      }
    }
    convert();
  }, [url]);

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-muted-foreground text-center py-8">{error}</p>;

  return (
    <div
      className="prose prose-sm max-w-none bg-white p-6 rounded-lg border overflow-auto max-h-[80vh]"
      dangerouslySetInnerHTML={{ __html: html || "" }}
    />
  );
}

function ExcelPreview({ url }: { url: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function convert() {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const tableHtml = XLSX.utils.sheet_to_html(firstSheet);
        setHtml(tableHtml);
      } catch {
        setError("Impossible de prévisualiser ce fichier Excel");
      } finally {
        setLoading(false);
      }
    }
    convert();
  }, [url]);

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-muted-foreground text-center py-8">{error}</p>;

  return (
    <div
      className="overflow-auto max-h-[80vh] bg-white rounded-lg border p-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1 [&_td]:text-sm [&_th]:border [&_th]:border-gray-200 [&_th]:px-2 [&_th]:py-1 [&_th]:text-sm [&_th]:bg-gray-50 [&_th]:font-medium"
      dangerouslySetInnerHTML={{ __html: html || "" }}
    />
  );
}

function VideoPreview({ url }: { url: string }) {
  return (
    <div className="bg-black rounded-lg overflow-hidden">
      <video src={url} controls className="w-full max-h-[80vh]">
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
    </div>
  );
}

function AudioPreview({ url, fileName }: { url: string; fileName: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center gap-4">
      <FileIcon className="h-12 w-12 text-muted-foreground" />
      <p className="text-sm font-medium">{fileName}</p>
      <audio src={url} controls className="w-full max-w-md">
        Votre navigateur ne supporte pas la lecture audio.
      </audio>
    </div>
  );
}

function NoPreview({ documentId, fileName }: { documentId: string; fileName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <FileIcon className="h-16 w-16 text-muted-foreground" />
      <p className="text-sm font-medium">{fileName}</p>
      <p className="text-sm text-muted-foreground">
        Aperçu non disponible pour ce type de fichier
      </p>
      <a href={`/api/documents/${documentId}/download`}>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Télécharger
        </Button>
      </a>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function DocumentPreview({ documentId, mimeType, fileName }: DocumentPreviewProps) {
  const previewUrl = `/api/documents/${documentId}/preview`;

  if (mimeType.startsWith("image/")) {
    return <ImagePreview url={previewUrl} fileName={fileName} />;
  }

  if (mimeType === "application/pdf") {
    return <PdfPreview url={previewUrl} />;
  }

  if (mimeType.startsWith("text/")) {
    return <TextPreview url={previewUrl} />;
  }

  if (isDocx(mimeType)) {
    return <DocxPreview url={previewUrl} />;
  }

  if (isExcel(mimeType)) {
    return <ExcelPreview url={previewUrl} />;
  }

  if (mimeType.startsWith("video/")) {
    return <VideoPreview url={previewUrl} />;
  }

  if (mimeType.startsWith("audio/")) {
    return <AudioPreview url={previewUrl} fileName={fileName} />;
  }

  return <NoPreview documentId={documentId} fileName={fileName} />;
}
