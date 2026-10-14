import { z } from "zod";

const password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(72, "Password is too long.");

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(180),
  password: z.string().min(1, "Enter your password.").max(72),
});

export const corporateRegisterSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid work email.").max(180),
  password,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  organizationName: z.string().trim().min(2, "Enter the organisation name.").max(160),
  industry: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  sizeBand: z.string().trim().max(40).optional().or(z.literal("")),
  newsletter: z.boolean(),
});

export const professionalRegisterSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(180),
  password,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  headline: z.string().trim().max(140).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  diaspora: z.boolean(),
  skills: z.string().trim().max(400).optional().or(z.literal("")),
  newsletter: z.boolean(),
});

export const organizationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  industry: z.string().trim().max(80).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  sizeBand: z.string().trim().max(40).optional().or(z.literal("")),
  about: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const contactSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  jobTitle: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export const serviceRequestSchema = z.object({
  requestType: z.enum([
    "executive_search",
    "personnel_outsourcing",
    "volume_resourcing",
    "team_building",
    "background_checks",
    "document_verification",
    "training",
  ]),
  title: z.string().trim().min(3, "Add a short title for this request.").max(160),
  description: z.string().trim().min(20, "Describe the need in a little more detail.").max(5000),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  headcount: z.coerce.number().int().min(1).max(5000).optional().or(z.nan()),
  urgency: z.enum(["standard", "priority", "critical"]),
});

export const professionalProfileSchema = z.object({
  headline: z.string().trim().max(140).optional().or(z.literal("")),
  summary: z.string().trim().max(3000).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  diaspora: z.boolean(),
  skills: z.string().trim().max(400).optional().or(z.literal("")),
  experienceYears: z.coerce.number().int().min(0).max(60).optional().or(z.nan()),
  industries: z.string().trim().max(300).optional().or(z.literal("")),
  linkedinUrl: z.string().trim().max(200).optional().or(z.literal("")),
  visibility: z.enum(["private", "selecture_only"]),
});

export const feedbackSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  topic: z.string().trim().min(2).max(80),
  message: z.string().trim().min(10).max(4000),
});

export const programRegistrationSchema = z.object({
  motivation: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const preferencesSchema = z.object({
  newsletter: z.boolean(),
  productUpdates: z.boolean(),
  requestAlerts: z.boolean(),
});

export const resetRequestSchema = z.object({
  email: z.string().trim().email().max(180),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password,
});

export const programSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens."),
  summary: z.string().trim().min(10).max(400),
  description: z.string().trim().min(20).max(8000),
  duration: z.string().trim().max(80).optional().or(z.literal("")),
  format: z.string().trim().max(80).optional().or(z.literal("")),
  audience: z.string().trim().max(160).optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
  startsOn: z.string().trim().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(99),
});

export const insightSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(90)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens."),
  excerpt: z.string().trim().min(10).max(400),
  body: z.string().trim().min(20).max(20000),
  category: z.string().trim().min(2).max(60),
  published: z.boolean(),
  authorName: z.string().trim().min(2).max(80),
});

export const adminMemberSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  password,
  accountType: z.enum(["admin", "super_admin"]),
});

export const requestUpdateSchema = z.object({
  status: z.enum([
    "submitted",
    "in_review",
    "assigned",
    "in_progress",
    "awaiting_client",
    "completed",
    "closed",
  ]),
  message: z.string().trim().min(2).max(4000),
  visibleToClient: z.boolean(),
  internalNotes: z.string().trim().max(4000).optional().or(z.literal("")),
  assignedTo: z.string().uuid().optional().or(z.literal("")),
});

export const registrationUpdateSchema = z.object({
  status: z.enum(["submitted", "confirmed", "waitlisted", "declined", "withdrawn"]),
});

export function splitList(value: string | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 24);
}

export function emptyToNull(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
