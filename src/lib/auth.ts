import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "chantierhub-session";
const PROJECT_COOKIE = "chantierhub-project";

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    }
    return null;
  }

  return session;
}

export async function getAuthor(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");
  return `${session.user.firstName} ${session.user.lastName}`;
}

export async function getUserId(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");
  return session.user.id;
}

export async function getCurrentProjectId(): Promise<string> {
  const cookieStore = await cookies();
  const projectId = cookieStore.get(PROJECT_COOKIE)?.value;
  if (!projectId) throw new Error("Aucun projet sélectionné");
  return projectId;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

export async function createSession(userId: string): Promise<string> {
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  return session.id;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const PROJECT_COOKIE_NAME = PROJECT_COOKIE;
