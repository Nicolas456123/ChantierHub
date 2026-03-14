import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProjectId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CommentsSection } from "@/components/comments-section";
import { EditTask } from "./edit-task";

export const dynamic = "force-dynamic";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const projectId = await getCurrentProjectId();

  const task = await prisma.task.findFirst({
    where: { id, projectId },
  });

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/taches">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
      </div>

      <div className="max-w-3xl space-y-6">
        <EditTask
          task={{
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            author: task.author,
            assignedTo: task.assignedTo,
            dueDate: task.dueDate
              ? task.dueDate.toISOString().split("T")[0]
              : null,
            createdAt: task.createdAt.toISOString(),
          }}
        />

        <CommentsSection entityType="task" entityId={task.id} />
      </div>
    </div>
  );
}
