import { cookies } from "next/headers";

export async function getAuthor(): Promise<string> {
  const cookieStore = await cookies();
  const pseudo = cookieStore.get("chantierhub-pseudo")?.value;
  if (!pseudo) throw new Error("Non authentifié");
  return decodeURIComponent(pseudo);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return !!cookieStore.get("chantierhub-auth")?.value;
}
