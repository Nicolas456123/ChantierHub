"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, FileIcon, Loader2, Maximize2, X } from "lucide-react";

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

function ImagePreview({ url, fileName, fullscreen }: { url: string; fileName: string; fullscreen?: boolean }) {
  return (
    <div className={`flex justify-center ${fullscreen ? "h-full" : ""} p-4 bg-gray-50 rounded-lg`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={fileName}
        className={`object-contain rounded ${fullscreen ? "max-w-full max-h-[calc(100dvh-80px)]" : "max-w-full max-h-[80vh]"}`}
      />
    </div>
  );
}

function PdfPreview({ url, fullscreen }: { url: string; fullscreen?: boolean }) {
  return (
    <iframe
      src={url}
      className="w-full rounded-lg border"
      style={{ height: fullscreen ? "calc(100dvh - 80px)" : "80vh" }}
      title="Aperçu PDF"
    />
  );
}

function TextPreview({ url, fullscreen }: { url: string; fullscreen?: boolean }) {
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
    <pre className={`bg-gray-50 p-4 rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap ${fullscreen ? "max-h-[calc(100dvh-80px)]" : "max-h-[80vh]"}`}>
      {content}
    </pre>
  );
}

function DocxPreview({ url, fullscreen }: { url: string; fullscreen?: boolean }) {
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
      className={`prose prose-sm max-w-none bg-white p-6 rounded-lg border overflow-auto ${fullscreen ? "max-h-[calc(100dvh-80px)]" : "max-h-[80vh]"}`}
      dangerouslySetInnerHTML={{ __html: html || "" }}
    />
  );
}

function ExcelPreview({ url, fullscreen }: { url: string; fullscreen?: boolean }) {
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
      className={`overflow-auto bg-white rounded-lg border p-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1 [&_td]:text-sm [&_th]:border [&_th]:border-gray-200 [&_th]:px-2 [&_th]:py-1 [&_th]:text-sm [&_th]:bg-gray-50 [&_th]:font-medium ${fullscreen ? "max-h-[calc(100dvh-80px)]" : "max-h-[80vh]"}`}
      dangerouslySetInnerHTML={{ __html: html || "" }}
    />
  );
}

function VideoPreview({ url, fullscreen }: { url: string; fullscreen?: boolean }) {
  return (
    <div className="bg-black rounded-lg overflow-hidden">
      <video src={url} controls className={`w-full ${fullscreen ? "max-h-[calc(100dvh-80px)]" : "max-h-[80vh]"}`}>
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

function PreviewContent({
  mimeType,
  previewUrl,
  documentId,
  fileName,
  fullscreen,
}: {
  mimeType: string;
  previewUrl: string;
  documentId: string;
  fileName: string;
  fullscreen?: boolean;
}) {
  if (mimeType.startsWith("image/")) {
    return <ImagePreview url={previewUrl} fileName={fileName} fullscreen={fullscreen} />;
  }
  if (mimeType === "application/pdf") {
    return <PdfPreview url={previewUrl} fullscreen={fullscreen} />;
  }
  if (mimeType.startsWith("text/")) {
    return <TextPreview url={previewUrl} fullscreen={fullscreen} />;
  }
  if (isDocx(mimeType)) {
    return <DocxPreview url={previewUrl} fullscreen={fullscreen} />;
  }
  if (isExcel(mimeType)) {
    return <ExcelPreview url={previewUrl} fullscreen={fullscreen} />;
  }
  if (mimeType.startsWith("video/")) {
    return <VideoPreview url={previewUrl} fullscreen={fullscreen} />;
  }
  if (mimeType.startsWith("audio/")) {
    return <AudioPreview url={previewUrl} fileName={fileName} />;
  }
  return <NoPreview documentId={documentId} fileName={fileName} />;
}

export function DocumentPreview({ documentId, mimeType, fileName }: DocumentPreviewProps) {
  const previewUrl = `/api/documents/${documentId}/preview`;
  const canFullscreen = !mimeType.startsWith("audio/") && !(
    !mimeType.startsWith("image/") &&
    mimeType !== "application/pdf" &&
    !mimeType.startsWith("text/") &&
    !isDocx(mimeType) &&
    !isExcel(mimeType) &&
    !mimeType.startsWith("video/")
  );

  return (
    <div className="relative">
      {canFullscreen && (
        <Dialog>
          <DialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10"
              />
            }
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            Plein écran
          </DialogTrigger>
          <DialogContent
            className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-[100dvh] !rounded-none !p-0"
            showCloseButton={false}
          >
            <DialogTitle className="sr-only">{fileName}</DialogTitle>
            <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
              <h3 className="text-sm font-medium truncate flex-1 mr-4">{fileName}</h3>
              <div className="flex items-center gap-2">
                <a href={`/api/documents/${documentId}/download`}>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Télécharger
                  </Button>
                </a>
                <DialogClose
                  render={<Button variant="ghost" size="icon" />}
                >
                  <X className="h-5 w-5" />
                </DialogClose>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <PreviewContent
                mimeType={mimeType}
                previewUrl={previewUrl}
                documentId={documentId}
                fileName={fileName}
                fullscreen
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <PreviewContent
        mimeType={mimeType}
        previewUrl={previewUrl}
        documentId={documentId}
        fileName={fileName}
      />
    </div>
  );
}
