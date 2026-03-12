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

// Legacy — kept for backward compatibility
export const CONSTRAINT_TYPES = [
  { value: "contractuelle", label: "Contractuelle" },
  { value: "reglementaire", label: "Réglementaire" },
  { value: "technique", label: "Technique" },
] as const;

export const CONSTRAINT_CATEGORIES = [
  // Pénalités contractuelles
  { value: "retard_execution", label: "Retard d'exécution", group: "Pénalités contractuelles" },
  { value: "livrables_documentaires", label: "Livrables documentaires", group: "Pénalités contractuelles" },
  { value: "sous_traitance", label: "Sous-traitance", group: "Pénalités contractuelles" },
  { value: "personnel_detachement", label: "Personnel / Détachement", group: "Pénalités contractuelles" },
  // Sécurité & Environnement
  { value: "securite", label: "Sécurité / EPI", group: "Sécurité & Environnement" },
  { value: "hygiene", label: "Hygiène", group: "Sécurité & Environnement" },
  { value: "environnement", label: "Environnement", group: "Sécurité & Environnement" },
  { value: "dechets", label: "Suivi des déchets", group: "Sécurité & Environnement" },
  // Organisation chantier
  { value: "nettoyage_chantier", label: "Nettoyage / Repliement", group: "Organisation chantier" },
  { value: "reunions", label: "Réunions (retard / absence)", group: "Organisation chantier" },
  { value: "absence_responsable", label: "Absence de responsable", group: "Organisation chantier" },
  // Autres
  { value: "qualite_mieux_disant", label: "Qualité / Mieux-disant", group: "Autres" },
  { value: "contractuelle", label: "Clause contractuelle", group: "Autres" },
  { value: "reglementaire", label: "Obligation réglementaire", group: "Autres" },
  { value: "autre", label: "Autre", group: "Autres" },
] as const;

export const CONSTRAINT_CATEGORY_GROUPS = [
  "Pénalités contractuelles",
  "Sécurité & Environnement",
  "Organisation chantier",
  "Autres",
] as const;

export const CONSTRAINT_STATUSES = [
  { value: "active", label: "Active", color: "bg-blue-100 text-blue-800" },
  { value: "respectee", label: "Respectée", color: "bg-green-100 text-green-800" },
  { value: "non_respectee", label: "Non respectée", color: "bg-red-100 text-red-800" },
] as const;

// Legacy — kept for backward compatibility
export const PENALTY_UNITS = [
  { value: "par_jour", label: "Par jour de retard" },
  { value: "forfaitaire", label: "Forfaitaire" },
  { value: "par_occurrence", label: "Par occurrence" },
] as const;

export const PENALTY_PER = [
  { value: "par_jour", label: "Par jour calendaire" },
  { value: "par_jour_ouvrable", label: "Par jour ouvré" },
  { value: "par_occurrence", label: "Par occurrence / manquement" },
  { value: "par_document", label: "Par document" },
  { value: "par_salarie", label: "Par salarié concerné" },
  { value: "par_manquement", label: "Par manquement constaté" },
  { value: "forfaitaire", label: "Forfaitaire (montant fixe)" },
  { value: "proportionnel", label: "Proportionnel au contrat" },
] as const;

export const PENALTY_CAP_UNITS = [
  { value: "montant_fixe", label: "Montant fixe (€)" },
  { value: "pourcentage_contrat", label: "% du montant HT du contrat" },
  { value: "par_unite", label: "Plafond par unité" },
] as const;

export const RECURRENCE_TYPES = [
  { value: "ponctuelle", label: "Ponctuelle (pas de récurrence)" },
  { value: "hebdomadaire", label: "Hebdomadaire" },
  { value: "bimensuelle", label: "Toutes les 2 semaines" },
  { value: "mensuelle", label: "Mensuelle" },
  { value: "trimestrielle", label: "Trimestrielle" },
] as const;

export const ATTENDANCE_STATUSES = [
  { value: "present", label: "Présent", color: "bg-green-100 text-green-800" },
  { value: "absent", label: "Absent", color: "bg-red-100 text-red-800" },
  { value: "excuse", label: "Excusé", color: "bg-yellow-100 text-yellow-800" },
  { value: "non_convoque", label: "Non convoqué", color: "bg-gray-100 text-gray-600" },
] as const;

export const OBSERVATION_STATUSES = [
  { value: "en_cours", label: "En cours", color: "bg-blue-100 text-blue-800" },
  { value: "fait", label: "Fait", color: "bg-green-100 text-green-800" },
  { value: "retard", label: "Retard", color: "bg-red-100 text-red-800" },
  { value: "urgent", label: "Urgent", color: "bg-orange-100 text-orange-800" },
] as const;

export const OBSERVATION_CATEGORIES = [
  { value: "administratif", label: "Administratif" },
  { value: "etudes", label: "Études" },
  { value: "controle", label: "Bureau de contrôle" },
  { value: "avancement", label: "Avancement / Prévisions" },
  { value: "visite", label: "Visite de chantier" },
] as const;

export const MEETING_REPORT_STATUSES = [
  { value: "brouillon", label: "Brouillon", color: "bg-gray-100 text-gray-800" },
  { value: "valide", label: "Validé", color: "bg-green-100 text-green-800" },
  { value: "diffuse", label: "Diffusé", color: "bg-blue-100 text-blue-800" },
] as const;

export const NAV_ITEMS = [
  { href: "/", label: "Tableau de bord", icon: "LayoutDashboard" },
  { href: "/journal", label: "Journal", icon: "BookOpen" },
  { href: "/demandes", label: "Demandes", icon: "FileQuestion" },
  { href: "/documents", label: "Documents", icon: "FolderOpen" },
  { href: "/taches", label: "Tâches", icon: "CheckSquare" },
  { href: "/contraintes", label: "Suivi contractuel", icon: "Shield" },
  { href: "/comptes-rendus", label: "Comptes-rendus", icon: "ClipboardList" },
  { href: "/planning", label: "Planning", icon: "CalendarRange" },
  { href: "/historique", label: "Historique", icon: "Clock" },
  { href: "/parametres", label: "Paramètres", icon: "Settings" },
] as const;
