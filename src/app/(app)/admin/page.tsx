"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  FolderKanban,
  ShieldCheck,
  Trash2,
  Loader2,
  UserPlus,
  UserMinus,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────
interface UserProject {
  id: string;
  role: string;
  project: { id: string; name: string };
}

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isGlobalAdmin: boolean;
  createdAt: string;
  userProjects: UserProject[];
}

interface AdminProject {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { userProjects: number };
}

type TabId = "users" | "projects";

// ─── Main Component ─────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<TabId>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, projectsRes, meRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/projects"),
        fetch("/api/auth/me"),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (meRes.ok) {
        const me = await meRes.json();
        setMeId(me.id);
      }
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function toggleAdmin(userId: string, currentValue: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGlobalAdmin: !currentValue }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success(!currentValue ? "Admin accordé" : "Admin retiré");
      loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur"
      );
    }
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Supprimer l'utilisateur ${name} ? Cette action est irréversible.`))
      return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Utilisateur supprimé");
      loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur"
      );
    }
  }

  async function revokeProjectAccess(userId: string, projectId: string) {
    try {
      const res = await fetch(
        `/api/admin/users/${userId}/projects?projectId=${projectId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      toast.success("Accès révoqué");
      loadData();
    } catch {
      toast.error("Erreur lors de la révocation");
    }
  }

  async function grantProjectAccess(userId: string, projectId: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, role: "member" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Accès accordé");
      loadData();
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  }

  async function deleteProject(projectId: string, name: string) {
    if (
      !confirm(
        `Supprimer le projet "${name}" et toutes ses données ? Cette action est irréversible.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Projet supprimé");
      loadData();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  const tabs = [
    { id: "users" as TabId, label: "Utilisateurs", icon: Users, count: users.length },
    { id: "projects" as TabId, label: "Projets", icon: FolderKanban, count: projects.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration"
        description="Gérez les utilisateurs et les projets"
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t.id
                  ? "bg-white border border-b-white -mb-[1px] text-orange-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <Badge variant="secondary" className="text-xs">
                {t.count}
              </Badge>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tab === "users" ? (
        <UsersTab
          users={users}
          projects={projects}
          meId={meId}
          onToggleAdmin={toggleAdmin}
          onDeleteUser={deleteUser}
          onGrantAccess={grantProjectAccess}
          onRevokeAccess={revokeProjectAccess}
        />
      ) : (
        <ProjectsTab projects={projects} onDelete={deleteProject} />
      )}
    </div>
  );
}

// ─── Users Tab ──────────────────────────────────────────────────────
function UsersTab({
  users,
  projects,
  meId,
  onToggleAdmin,
  onDeleteUser,
  onGrantAccess,
  onRevokeAccess,
}: {
  users: AdminUser[];
  projects: AdminProject[];
  meId: string;
  onToggleAdmin: (id: string, current: boolean) => void;
  onDeleteUser: (id: string, name: string) => void;
  onGrantAccess: (userId: string, projectId: string) => void;
  onRevokeAccess: (userId: string, projectId: string) => void;
}) {
  const [addingProjectFor, setAddingProjectFor] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {users.map((user) => {
        const isMe = user.id === meId;
        const userProjectIds = new Set(
          user.userProjects.map((up) => up.project.id)
        );
        const availableProjects = projects.filter(
          (p) => !userProjectIds.has(p.id)
        );

        return (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {user.firstName} {user.lastName}
                    </h3>
                    {user.isGlobalAdmin && (
                      <Badge className="bg-orange-100 text-orange-800 text-xs">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {isMe && (
                      <Badge variant="outline" className="text-xs">
                        Vous
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Inscrit le{" "}
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </p>

                  {/* Projects */}
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Projets ({user.userProjects.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {user.userProjects.map((up) => (
                        <Badge
                          key={up.id}
                          variant="secondary"
                          className="text-xs flex items-center gap-1"
                        >
                          {up.project.name}
                          <span className="text-muted-foreground">
                            ({up.role})
                          </span>
                          <button
                            onClick={() =>
                              onRevokeAccess(user.id, up.project.id)
                            }
                            className="ml-1 hover:text-red-600"
                            title="Révoquer l'accès"
                          >
                            <UserMinus className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {availableProjects.length > 0 && (
                        addingProjectFor === user.id ? (
                          <Select
                            onValueChange={(v: string | null) => {
                              if (v) onGrantAccess(user.id, v);
                              setAddingProjectFor(null);
                            }}
                          >
                            <SelectTrigger className="h-6 w-40 text-xs">
                              <SelectValue placeholder="Choisir un projet" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProjects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setAddingProjectFor(user.id)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Ajouter
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant={user.isGlobalAdmin ? "outline" : "default"}
                    size="sm"
                    onClick={() => onToggleAdmin(user.id, user.isGlobalAdmin)}
                    disabled={isMe}
                    title={
                      user.isGlobalAdmin
                        ? "Retirer les droits admin"
                        : "Accorder les droits admin"
                    }
                  >
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    {user.isGlobalAdmin ? "Retirer admin" : "Rendre admin"}
                  </Button>
                  {!isMe && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        onDeleteUser(
                          user.id,
                          `${user.firstName} ${user.lastName}`
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Projects Tab ───────────────────────────────────────────────────
function ProjectsTab({
  projects,
  onDelete,
}: {
  projects: AdminProject[];
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>
                    {project._count.userProjects} membre
                    {project._count.userProjects !== 1 ? "s" : ""}
                  </span>
                  <span>
                    Créé le{" "}
                    {new Date(project.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(project.id, project.name)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {projects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Aucun projet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
