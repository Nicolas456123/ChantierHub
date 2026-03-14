"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/constants";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  FolderOpen,
  CheckSquare,
  Shield,
  ClipboardList,
  CalendarRange,
  Clock,
  Settings,
  HardHat,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  FolderOpen,
  CheckSquare,
  Shield,
  ClipboardList,
  CalendarRange,
  Clock,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-white">
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <HardHat className="h-6 w-6 text-orange-600" />
        <span className="text-lg font-semibold">ChantierHub</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-6">
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
                  const isActive = item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
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
        </div>
      </nav>
    </aside>
  );
}
