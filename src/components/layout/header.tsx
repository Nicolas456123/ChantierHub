"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User, FolderOpen } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { useState, useEffect } from "react";

export function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.firstName) setUserName(`${data.firstName} ${data.lastName}`);
      })
      .catch(() => {});

    fetch("/api/settings")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.name) setProjectName(data.name);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleSwitchProject() {
    // Clear the project cookie by calling an API, then redirect
    document.cookie = "chantierhub-project=; path=/; max-age=0";
    router.push("/projects");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {projectName && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700"
            onClick={handleSwitchProject}
            title="Changer de projet"
          >
            <FolderOpen className="h-4 w-4" />
            {projectName}
          </Button>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span className="font-medium">{userName}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Se d&#233;connecter">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
