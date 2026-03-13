"use client";

import { useState, useRef, useCallback } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { PhotoLightbox } from "./photo-lightbox";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";

interface Photo {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  caption?: string | null;
  author: string;
  entityType: string;
  entityId: string;
  projectId: string;
  createdAt: string;
}

interface PhotoUploadProps {
  entityType: string;
  entityId: string;
  photos: Photo[];
  onPhotosChange?: (photos: Photo[]) => void;
  maxPhotos?: number;
  compact?: boolean;
}

function getPhotoSrc(photo: Photo) {
  return `/api/photos/${photo.id}/serve`;
}

export function PhotoUpload({
  entityType,
  entityId,
  photos,
  onPhotosChange,
  maxPhotos = 10,
  compact = false,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remaining = maxPhotos - photos.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${maxPhotos} photos atteint`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remaining);
      setUploading(true);

      try {
        const newPhotos: Photo[] = [];

        for (let file of filesToUpload) {
          if (!file.type.startsWith("image/")) {
            toast.error(`${file.name} n'est pas une image`);
            continue;
          }

          // Compresser automatiquement les images > 1 Mo
          file = await compressImage(file);

          if (file.size > 5 * 1024 * 1024) {
            toast.error(`${file.name} dépasse 5 Mo même après compression`);
            continue;
          }

          const formData = new FormData();
          formData.append("file", file);
          formData.append("entityType", entityType);
          formData.append("entityId", entityId);

          const res = await fetch("/api/photos", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            toast.error(data.error || "Erreur upload");
            continue;
          }

          const photo = await res.json();
          newPhotos.push(photo);
        }

        if (newPhotos.length > 0) {
          const updated = [...photos, ...newPhotos];
          onPhotosChange?.(updated);
          toast.success(
            newPhotos.length === 1
              ? "Photo ajoutée"
              : `${newPhotos.length} photos ajoutées`
          );
        }
      } catch {
        toast.error("Erreur lors de l'upload");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [entityType, entityId, photos, maxPhotos, onPhotosChange]
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
      try {
        const res = await fetch(`/api/photos/${photoId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          toast.error("Erreur lors de la suppression");
          return;
        }
        const updated = photos.filter((p) => p.id !== photoId);
        onPhotosChange?.(updated);
        toast.success("Photo supprimée");
      } catch {
        toast.error("Erreur lors de la suppression");
      }
    },
    [photos, onPhotosChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Thumbnails */}
        {photos.map((photo, idx) => (
          <div key={photo.id} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getPhotoSrc(photo)}
              alt={photo.caption || photo.fileName}
              className="h-8 w-8 rounded object-cover cursor-pointer border border-gray-200"
              onClick={() => setLightboxIndex(idx)}
            />
            <button
              onClick={() => handleDelete(photo.id)}
              className="absolute -top-1 -right-1 hidden group-hover:flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-white"
            >
              <X className="h-2 w-2" />
            </button>
          </div>
        ))}

        {/* Add button */}
        {photos.length < maxPhotos && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-8 w-8 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ImagePlus className="h-3 w-3" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </>
        )}

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={photos}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Thumbnails grid */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getPhotoSrc(photo)}
                alt={photo.caption || photo.fileName}
                className="h-20 w-20 rounded-lg object-cover cursor-pointer border border-gray-200 hover:border-blue-400 transition-colors"
                onClick={() => setLightboxIndex(idx)}
              />
              <button
                onClick={() => handleDelete(photo.id)}
                className="absolute -top-2 -right-2 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {photos.length < maxPhotos && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5 text-gray-400" />
          )}
          <div className="text-sm text-gray-500">
            <span className="font-medium text-blue-600">Cliquez</span> ou
            glissez des images ici
            <span className="text-xs text-gray-400 ml-2">
              (max 5 Mo, {photos.length}/{maxPhotos})
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
