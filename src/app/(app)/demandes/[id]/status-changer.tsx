"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { REQUEST_STATUSES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface StatusChangerProps {
  requestId: string;
  currentStatus: string;
  requestData: {
    title: string;
    description?: string;
    type: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

export function StatusChanger({
  requestId,
  currentStatus,
  requestData,
}: StatusChangerProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return;

    setIsUpdating(newStatus);

    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestData,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise a jour");
      }

      const statusLabel = REQUEST_STATUSES.find(
        (s) => s.value === newStatus
      )?.label;
      toast.success(`Statut mis a jour: ${statusLabel}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise a jour du statut"
      );
    } finally {
      setIsUpdating(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {REQUEST_STATUSES.map((status) => (
        <Button
          key={status.value}
          variant={currentStatus === status.value ? "default" : "outline"}
          size="sm"
          className="justify-start"
          disabled={isUpdating !== null || currentStatus === status.value}
          onClick={() => handleStatusChange(status.value)}
        >
          {isUpdating === status.value && (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          )}
          <span
            className={`h-2 w-2 rounded-full mr-2 ${
              currentStatus === status.value
                ? "bg-white"
                : status.color.split(" ")[0].replace("bg-", "bg-")
            }`}
            style={{
              backgroundColor:
                currentStatus === status.value
                  ? undefined
                  : status.value === "en_attente"
                  ? "#ca8a04"
                  : status.value === "en_cours"
                  ? "#2563eb"
                  : status.value === "valide"
                  ? "#16a34a"
                  : "#dc2626",
            }}
          />
          {status.label}
        </Button>
      ))}
    </div>
  );
}
