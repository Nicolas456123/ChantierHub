export const EVENT_CATEGORIES = [
  { value: "observation", label: "Observation" },
  { value: "incident", label: "Incident" },
  { value: "decision", label: "Décision" },
  { value: "livraison", label: "Livraison" },
  { value: "reunion", label: "Réunion" },
  { value: "autre", label: "Autre" },
] as const;

export const REQUEST_TYPES = [
  { value: "demande", label: "Demande" },
  { value: "decision", label: "Décision" },
  { value: "approbation", label: "Approbation" },
] as const;

export const REQUEST_STATUSES = [
  { value: "en_attente", label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  { value: "en_cours", label: "En cours", color: "bg-blue-100 text-blue-800" },
  { value: "valide", label: "Validé", color: "bg-green-100 text-green-800" },
  { value: "refuse", label: "Refusé", color: "bg-red-100 text-red-800" },
] as const;

export const TASK_STATUSES = [
  { value: "a_faire", label: "À faire", color: "bg-gray-100 text-gray-800" },
  { value: "en_cours", label: "En cours", color: "bg-blue-100 text-blue-800" },
  { value: "termine", label: "Terminé", color: "bg-green-100 text-green-800" },
] as const;

export const PRIORITIES = [
  { value: "basse", label: "Basse", color: "bg-gray-100 text-gray-600" },
  { value: "normale", label: "Normale", color: "bg-blue-100 text-blue-700" },
  { value: "haute", label: "Haute", color: "bg-orange-100 text-orange-700" },
  { value: "urgente", label: "Urgente", color: "bg-red-100 text-red-700" },
] as const;

export const DOCUMENT_CATEGORIES = [
  { value: "plan", label: "Plan" },
  { value: "photo", label: "Photo" },
  { value: "rapport", label: "Rapport" },
  { value: "contrat", label: "Contrat" },
  { value: "facture", label: "Facture" },
  { value: "autre", label: "Autre" },
] as const;

export const NAV_ITEMS = [
  { href: "/", label: "Tableau de bord", icon: "LayoutDashboard" },
  { href: "/journal", label: "Journal", icon: "BookOpen" },
  { href: "/demandes", label: "Demandes", icon: "FileQuestion" },
  { href: "/documents", label: "Documents", icon: "FolderOpen" },
  { href: "/taches", label: "Tâches", icon: "CheckSquare" },
  { href: "/historique", label: "Historique", icon: "Clock" },
  { href: "/parametres", label: "Paramètres", icon: "Settings" },
] as const;
