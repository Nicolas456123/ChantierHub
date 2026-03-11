"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TASK_STATUSES } from "@/lib/constants";
import { toast } from "sonner";

interface TaskStatusChangerProps {
  taskId: string;
  currentStatus: string;
  task: {
    title: string;
    description?: string;
    priority: string;
    assignedTo?: string;
    dueDate?: string;
  };
}

export function TaskStatusChanger({
  taskId,
  currentStatus,
  task,
}: TaskStatusChangerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function changeStatus(newStatus: string) {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...task,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      const statusLabel =
        TASK_STATUSES.find((s) => s.value === newStatus)?.label ?? newStatus;
      toast.success(`Statut changé en "${statusLabel}"`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors du changement de statut"
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {TASK_STATUSES.map((status) => (
        <Button
          key={status.value}
          variant={currentStatus === status.value ? "default" : "outline"}
          size="sm"
          disabled={currentStatus === status.value || loading !== null}
          onClick={() => changeStatus(status.value)}
        >
          {loading === status.value ? "..." : status.label}
        </Button>
      ))}
    </div>
  );
}
