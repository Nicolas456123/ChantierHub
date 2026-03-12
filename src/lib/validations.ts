import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").max(50),
  lastName: z.string().min(1, "Le nom est requis").max(50),
  email: z.email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const eventSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().optional(),
  category: z.enum(["observation", "incident", "decision", "livraison", "reunion", "autre"]),
  date: z.string().optional(),
  priority: z.enum(["basse", "normale", "haute", "urgente"]).default("normale"),
});

export const requestSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().optional(),
  type: z.enum(["demande", "decision", "approbation"]),
  status: z.enum(["en_attente", "en_cours", "valide", "refuse"]).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional().nullable(),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Le commentaire ne peut pas être vide").max(2000),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().optional(),
  status: z.enum(["a_faire", "en_cours", "termine"]).default("a_faire"),
  priority: z.enum(["basse", "normale", "haute", "urgente"]).default("normale"),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional().nullable(),
});

export const documentSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(200),
  description: z.string().optional(),
  category: z.enum(["plan", "photo", "rapport", "contrat", "facture", "autre"]),
});

export const settingsSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  address: z.string().optional(),
});

export const constraintSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().optional(),
  type: z.string().optional(), // backward compat
  category: z.enum([
    "retard_execution", "livrables_documentaires", "sous_traitance", "personnel_detachement",
    "securite", "hygiene", "environnement", "dechets",
    "nettoyage_chantier", "reunions", "absence_responsable",
    "qualite_mieux_disant", "contractuelle", "reglementaire", "autre",
  ]),
  status: z.enum(["active", "respectee", "non_respectee"]).default("active"),
  dueDate: z.string().optional().nullable(),
  articleRef: z.string().max(100).optional().nullable(),
  penaltyAmount: z.number().optional().nullable(),
  penaltyUnit: z.string().optional().nullable(), // backward compat
  penaltyPer: z.enum([
    "par_jour", "par_jour_ouvrable", "par_occurrence", "par_document",
    "par_salarie", "par_manquement", "forfaitaire", "proportionnel",
  ]).optional().nullable(),
  penaltyFormula: z.string().max(500).optional().nullable(),
  penaltyCap: z.number().optional().nullable(),
  penaltyCapUnit: z.enum(["montant_fixe", "pourcentage_contrat", "par_unite"]).optional().nullable(),
  penaltyDetails: z.string().optional(),
  escalation: z.string().max(1000).optional().nullable(),
  condition: z.string().max(1000).optional().nullable(),
  sourceDocument: z.string().max(200).optional().nullable(),
  occurrences: z.number().int().min(0).optional().default(0),
  recurrenceType: z.enum(["ponctuelle", "hebdomadaire", "bimensuelle", "mensuelle", "trimestrielle"]).optional().nullable(),
  recurrenceDay: z.number().int().min(1).max(31).optional().nullable(),
  responsible: z.string().optional(),
});

export const accessCodeSchema = z.object({
  currentCode: z.string().min(1),
  newCode: z.string().min(4, "Le code doit contenir au moins 4 caractères").max(20),
});
