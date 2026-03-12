"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CONSTRAINT_STATUSES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface StatusChangerProps {
  constraintId: string;
  currentStatus: string;
}

export function StatusChanger({
  constraintId,
  currentStatus,
}: StatusChangerProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return;

    setIsUpdating(newStatus);

    try {
      const res = await fetch(`/api/constraints/${constraintId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise a jour");
      }

      const statusLabel = CONSTRAINT_STATUSES.find(
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
      {CONSTRAINT_STATUSES.map((status) => (
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
            className={`h-2 w-2 rounded-full mr-2`}
            style={{
              backgroundColor:
                currentStatus === status.value
                  ? undefined
                  : status.value === "active"
                  ? "#2563eb"
                  : status.value === "respectee"
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
