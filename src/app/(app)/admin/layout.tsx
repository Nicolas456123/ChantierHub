import { redirect } from "next/navigation";
import { isGlobalAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isGlobalAdmin();
  if (!admin) redirect("/");
  return <>{children}</>;
}
