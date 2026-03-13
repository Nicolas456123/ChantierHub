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

export function RequestPhotos({ requestId }: { requestId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    fetch(`/api/photos?entityType=request&entityId=${requestId}`)
      .then((r) => r.json())
      .then(setPhotos)
      .catch(() => {});
  }, [requestId]);

  return (
    <PhotoUpload
      entityType="request"
      entityId={requestId}
      photos={photos}
      onPhotosChange={setPhotos}
      maxPhotos={10}
    />
  );
}
