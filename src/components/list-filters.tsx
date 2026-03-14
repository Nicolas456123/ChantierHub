"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterTab {
  value: string;
  label: string;
  count?: number;
  color?: string;
}

interface ListFiltersProps {
  searchPlaceholder?: string;
  tabs?: FilterTab[];
  tabParam?: string;
  showSearch?: boolean;
}

export function ListFilters({
  searchPlaceholder = "Rechercher…",
  tabs,
  tabParam = "status",
  showSearch = true,
}: ListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const currentSearch = searchParams.get("q") ?? "";
  const currentTab = searchParams.get(tabParam) ?? "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  const handleSearchChange = useCallback(
    (val: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => updateParams("q", val), 300);
    },
    [updateParams]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {showSearch && (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            defaultValue={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-8"
          />
          {currentSearch && (
            <button
              onClick={() => updateParams("q", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-sm hover:bg-muted"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => updateParams(tabParam, "")}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !currentTab
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Tous
          </button>
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() =>
                updateParams(tabParam, currentTab === tab.value ? "" : tab.value)
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                currentTab === tab.value
                  ? "bg-gray-900 text-white"
                  : tab.color
                  ? `${tab.color} hover:opacity-80`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px]",
                    currentTab === tab.value
                      ? "bg-white/20"
                      : "bg-black/5"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {isPending && (
        <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
      )}
    </div>
  );
}
