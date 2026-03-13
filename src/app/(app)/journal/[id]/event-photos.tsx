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

export function EventPhotos({ eventId }: { eventId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    fetch(`/api/photos?entityType=event&entityId=${eventId}`)
      .then((r) => r.json())
      .then(setPhotos)
      .catch(() => {});
  }, [eventId]);

  return (
    <PhotoUpload
      entityType="event"
      entityId={eventId}
      photos={photos}
      onPhotosChange={setPhotos}
      maxPhotos={10}
    />
  );
}
