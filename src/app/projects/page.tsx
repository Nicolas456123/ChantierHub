"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, Plus, LogIn, FolderOpen, Loader2 } from "lucide-react";

interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  role: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "join" | "create">("list");
  const [accessCode, setAccessCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [newAccessCode, setNewAccessCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.ok ? res.json() : [])
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function selectProject(projectId: string) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Erreur lors de la sélection");
    } finally {
      setSubmitting(false);
    }
  }

  async function joinProject(e: React.FormEvent) {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError("Veuillez entrer un code d'accès");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/projects/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: accessCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Code incorrect");
        setSubmitting(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Erreur de connexion");
      setSubmitting(false);
    }
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Le nom du projet est requis");
      return;
    }
    if (newAccessCode.trim().length < 4) {
      setError("Le code d'accès doit contenir au moins 4 caractères");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          accessCode: newAccessCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la création");
        setSubmitting(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Erreur de connexion");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
            <HardHat className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold">ChantierHub</h1>
          <p className="text-muted-foreground mt-1">Sélectionnez un projet</p>
        </div>

        {mode === "list" && (
          <>
            {projects.length > 0 && (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => !submitting && selectProject(project.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <FolderOpen className="h-5 w-5 text-orange-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{project.name}</p>
                        {project.description && (
                          <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" onClick={() => { setMode("join"); setError(""); }}>
                <LogIn className="h-4 w-4 mr-2" />
                Rejoindre
              </Button>
              <Button className="w-full" onClick={() => { setMode("create"); setError(""); }}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un projet
              </Button>
            </div>
          </>
        )}

        {mode === "join" && (
          <Card>
            <CardHeader>
              <CardTitle>Rejoindre un projet</CardTitle>
              <CardDescription>Entrez le code d&apos;accès du projet</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={joinProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Code d&apos;accès</Label>
                  <Input
                    id="accessCode"
                    type="text"
                    placeholder="Entrez le code du projet..."
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => { setMode("list"); setError(""); }} className="flex-1">
                    Retour
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? "Chargement..." : "Rejoindre"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {mode === "create" && (
          <Card>
            <CardHeader>
              <CardTitle>Créer un projet</CardTitle>
              <CardDescription>Configurez votre nouveau chantier</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Nom du projet</Label>
                  <Input
                    id="projectName"
                    type="text"
                    placeholder="Mon Chantier"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newAccessCode">Code d&apos;accès</Label>
                  <Input
                    id="newAccessCode"
                    type="text"
                    placeholder="Code pour rejoindre (min. 4 caractères)"
                    value={newAccessCode}
                    onChange={(e) => setNewAccessCode(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Partagez ce code avec votre équipe pour qu&apos;ils rejoignent le projet.
                  </p>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => { setMode("list"); setError(""); }} className="flex-1">
                    Retour
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? "Création..." : "Créer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
