"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, FileIcon, Loader2, Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

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

function ZoomableContainer({ children, fullscreen }: { children: React.ReactNode; fullscreen?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !fullscreen) return;

    function getTouchDistance(touches: TouchList) {
      return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
    }

    function getTouchCenter(touches: TouchList) {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    }

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastTouchDistance.current = getTouchDistance(e.touches);
        lastTouchCenter.current = getTouchCenter(e.touches);
        isDragging.current = true;
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        e.preventDefault();
        const newDist = getTouchDistance(e.touches);
        const newCenter = getTouchCenter(e.touches);
        const ratio = newDist / lastTouchDistance.current;

        setScale((prev) => Math.min(Math.max(prev * ratio, 0.5), 5));

        if (lastTouchCenter.current) {
          const dx = newCenter.x - lastTouchCenter.current.x;
          const dy = newCenter.y - lastTouchCenter.current.y;
          setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        }

        lastTouchDistance.current = newDist;
        lastTouchCenter.current = newCenter;
      }
    }

    function handleTouchEnd() {
      lastTouchDistance.current = null;
      lastTouchCenter.current = null;
      isDragging.current = false;
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [fullscreen]);

  if (!fullscreen) {
    return <>{children}</>;
  }

  return (
    <div className="relative h-full">
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white/90 backdrop-blur-sm"
          onClick={() => setScale((s) => Math.min(s * 1.3, 5))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white/90 backdrop-blur-sm"
          onClick={() => setScale((s) => Math.max(s / 1.3, 0.5))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        {scale !== 1 && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-white/90 backdrop-blur-sm"
            onClick={resetZoom}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div
        ref={containerRef}
        className="h-full overflow-hidden touch-none"
        style={{ touchAction: "none" }}
      >
        <div
          className="h-full flex items-center justify-center transition-transform duration-75"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function ImagePreview({ url, fileName, fullscreen }: { url: string; fileName: string; fullscreen?: boolean }) {
  return (
    <ZoomableContainer fullscreen={fullscreen}>
      <div className={`flex justify-center ${fullscreen ? "h-full" : ""} p-4 bg-gray-50 rounded-lg`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={fileName}
          className={`object-contain rounded ${fullscreen ? "max-w-full max-h-[calc(100dvh-80px)]" : "max-w-full max-h-[80vh]"}`}
        />
      </div>
    </ZoomableContainer>
  );
}

function PdfPreview({ url, fullscreen }: { url: string; fullscreen?: boolean }) {
  return (
    <ZoomableContainer fullscreen={fullscreen}>
      <iframe
        src={url}
        className="w-full rounded-lg border"
        style={{ height: fullscreen ? "calc(100dvh - 80px)" : "80vh", width: "100%" }}
        title="Aperçu PDF"
      />
    </ZoomableContainer>
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
            className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-[100dvh] !rounded-none !p-0 touch-none"
            showCloseButton={false}
            style={{ touchAction: "none" }}
          >
            <DialogTitle className="sr-only">{fileName}</DialogTitle>
            <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b bg-white shrink-0">
              <div className="flex items-center gap-2 shrink-0">
                <DialogClose
                  render={<Button variant="ghost" size="icon" className="shrink-0" />}
                >
                  <X className="h-5 w-5" />
                </DialogClose>
              </div>
              <h3 className="text-sm font-medium truncate mx-2 flex-1 text-center">{fileName}</h3>
              <a href={`/api/documents/${documentId}/download`} className="shrink-0">
                <Button variant="outline" size="icon" className="sm:hidden">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Download className="h-4 w-4 mr-1" />
                  Télécharger
                </Button>
              </a>
            </div>
            <div className="flex-1 overflow-auto p-2 touch-pan-x touch-pan-y" style={{ touchAction: "pan-x pan-y" }}>
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
