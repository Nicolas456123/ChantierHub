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

export const accessCodeSchema = z.object({
  currentCode: z.string().min(1),
  newCode: z.string().min(4, "Le code doit contenir au moins 4 caractères").max(20),
});
