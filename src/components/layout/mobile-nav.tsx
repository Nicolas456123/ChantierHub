"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  HardHat,
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  FolderOpen,
  CheckSquare,
  Shield,
  ClipboardList,
  CalendarRange,
  CalendarDays,
  Clock,
  Settings,
  MessageSquarePlus,
  ShieldCheck,
  LogOut,
  FolderSync,
  User,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, BookOpen, FileQuestion, FolderOpen, CheckSquare, Shield,
  ClipboardList, CalendarRange, CalendarDays, Clock, Settings, MessageSquarePlus, ShieldCheck,
};

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setIsAdmin(data.isGlobalAdmin === true);
        if (data.firstName) setUserName(`${data.firstName} ${data.lastName}`);
      })
      .catch(() => {});
  }, []);

  function handleSwitchProject() {
    document.cookie = "chantierhub-project=; path=/; max-age=0";
    onClose();
    router.push("/projects");
    router.refresh();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onClose();
    router.push("/login");
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0 flex flex-col gap-0">
        <SheetHeader className="flex h-14 shrink-0 flex-row items-center gap-2 px-6 border-b">
          <HardHat className="h-6 w-6 text-orange-600" />
          <SheetTitle className="text-lg font-semibold">ChantierHub</SheetTitle>
        </SheetHeader>

        {/* Scrollable nav area */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-4">
            {NAV_GROUPS.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {group.label}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = iconMap[item.icon];
                    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-orange-50 text-orange-700 font-medium"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          )}
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {isAdmin && (
              <div>
                <ul className="space-y-0.5">
                  <li>
                    <Link
                      href="/admin"
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname.startsWith("/admin")
                          ? "bg-orange-50 text-orange-700 font-medium"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Administration
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </nav>

        {/* Fixed bottom section */}
        <div className="shrink-0 border-t bg-white p-3 space-y-1">
          {userName && (
            <Link
              href="/profil"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === "/profil"
                  ? "bg-orange-50 text-orange-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <User className="h-4 w-4" />
              <span className="truncate">{userName}</span>
            </Link>
          )}
          <button
            onClick={handleSwitchProject}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <FolderSync className="h-4 w-4" />
            Changer de projet
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
