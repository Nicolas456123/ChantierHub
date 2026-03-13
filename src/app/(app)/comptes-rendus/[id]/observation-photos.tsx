"use client";

import { useEffect, useState } from "react";
import { PhotoUpload } from "@/components/photo-upload";

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

export function ObservationPhotos({
  observationId,
}: {
  observationId: string;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    fetch(`/api/photos?entityType=observation&entityId=${observationId}`)
      .then((r) => r.json())
      .then(setPhotos)
      .catch(() => {});
  }, [observationId]);

  return (
    <PhotoUpload
      entityType="observation"
      entityId={observationId}
      photos={photos}
      onPhotosChange={setPhotos}
      maxPhotos={5}
      compact
    />
  );
}
