import { prisma } from "@/lib/prisma";

interface LogActivityParams {
  type: string;
  description: string;
  author: string;
  entityType: string;
  entityId?: string;
  projectId: string;
}

export async function logActivity(params: LogActivityParams) {
  await prisma.activity.create({
    data: {
      type: params.type,
      description: params.description,
      author: params.author,
      entityType: params.entityType,
      entityId: params.entityId,
      projectId: params.projectId,
    },
  });
}
