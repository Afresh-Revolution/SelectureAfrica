import type { RegistrationStatus, ServiceRequestStatus, ServiceRequestType } from "@/types";

export const SITE = {
  name: "Selecture Africa",
  tagline: "Talent Delivered",
  domain: "selecture.org",
  email: "info@selectureafrica.com",
  description:
    "Selecture Africa connects organizations with skilled professionals and builds pathways for training, workforce development, recruitment and outsourcing across Africa and the diaspora.",
  lagos: {
    company: "Selecture Africa Ltd",
    lines: ["11 Frajend Close", "Osborne Foreshore Estate", "Ikoyi, Lagos State", "Nigeria"],
    phone: "+234 817 365 4597",
    phoneHref: "tel:+2348173654597",
  },
  london: {
    company: "Selecture Africa Ltd",
    lines: ["86-90 Paul Street", "London EC2A 4NE", "United Kingdom"],
    phone: "+44 203 823 6998",
    phoneHref: "tel:+442038236998",
  },
};

export const NAV = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/industries", label: "Industries" },
  { href: "/employers", label: "Employers" },
  { href: "/professionals", label: "Professionals" },
  { href: "/programs", label: "Programs" },
  { href: "/insights", label: "Insights" },
  { href: "/contact", label: "Contact" },
];

export const SERVICES: {
  slug: ServiceRequestType;
  title: string;
  summary: string;
  detail: string;
}[] = [
  {
    slug: "executive_search",
    title: "Executive Search & Selection",
    summary: "Senior hiring led by a dedicated consultant, from the first briefing to a signed offer.",
    detail:
      "We consult with business principals, research the market, screen and qualify high-calibre talent, present candidates to HR and hiring managers, support interviews, and close the contract. A senior consultant owns the assignment end to end, with a research team and senior advisers alongside.",
  },
  {
    slug: "personnel_outsourcing",
    title: "Personnel Outsourcing",
    summary: "Local and expatriate professionals managed on short- or long-term arrangements.",
    detail:
      "Selecture outsources and manages skilled, technical and professional talent. Existing employees can be absorbed into the arrangement, and additional headcount can be recruited and managed on a client’s behalf, through to payroll administration.",
  },
  {
    slug: "volume_resourcing",
    title: "Volume Resourcing",
    summary: "Structured hiring support when a workforce needs to grow with pace and care.",
    detail:
      "For organisations forecasting a significant recruitment drive, a dedicated account team prioritises requirements, runs an initial search and qualification period, and keeps quality consistent across the slate.",
  },
  {
    slug: "team_building",
    title: "Team Building",
    summary: "Cohorts assembled for culture, capability and the work ahead.",
    detail:
      "We treat team composition as a design problem: technical competence, intercultural fluency and the specific culture of the hiring organisation. Every project is scoped individually.",
  },
  {
    slug: "background_checks",
    title: "Background Reference Checks",
    summary: "Screening that protects the business from fraud, theft and reputational harm.",
    detail:
      "Selecture leads background screening and criminal checks in Nigeria, with experience across sectors. Packages are shaped with the client so the checks match the risk of the role.",
  },
  {
    slug: "document_verification",
    title: "Document Verification",
    summary: "Role-appropriate checks for new hires and employees moving into new posts.",
    detail:
      "Verification evaluates whether a person is suitable to hold employment in the organisation. It applies to incoming employees and to existing staff changing roles, as part of a continuous screening strategy.",
  },
];

export const SEARCH_STEPS = [
  { n: "01", title: "Consult with business principals", phase: "Search" },
  { n: "02", title: "Research candidates", phase: "Search" },
  { n: "03", title: "Screen and qualify top talent", phase: "Qualification" },
  { n: "04", title: "Present CVs to HR and hiring managers", phase: "Qualification" },
  { n: "05", title: "Complete interviews and selection", phase: "Selection" },
  { n: "06", title: "Close process, contract and hire", phase: "Selection" },
];

export const OUTSOURCE_STEPS = [
  { n: "01", title: "Dedicate an account manager", phase: "Search" },
  { n: "02", title: "Screen and qualify top talent", phase: "Search" },
  { n: "03", title: "Present CVs to HR and hiring managers", phase: "Qualification" },
  { n: "04", title: "Complete interviews and selection", phase: "Qualification" },
  { n: "05", title: "Conduct background and verification checks", phase: "Selection" },
  { n: "06", title: "Close process and manage payroll", phase: "Selection" },
];

export const INDUSTRIES = [
  {
    title: "Banking & Finance",
    text: "Leadership, control functions and specialist roles where judgement and regulatory fluency matter.",
  },
  {
    title: "FMCG",
    text: "Commercial, supply and operational talent for businesses that move product at scale.",
  },
  {
    title: "Technology",
    text: "Product, engineering and go-to-market leaders who can build in African and international markets.",
  },
  {
    title: "Oil & Gas",
    text: "Technical and corporate appointments across energy operations, projects and support functions.",
  },
  {
    title: "Management Consulting",
    text: "Advisers and practice leaders who can hold a client relationship and deliver the work.",
  },
  {
    title: "Legal",
    text: "Counsel and practice talent for firms and in-house teams with cross-border exposure.",
  },
  {
    title: "Public Sector",
    text: "Professionals who can operate with public accountability and institutional complexity.",
  },
];

export const VALUES = [
  {
    title: "Partnership before process",
    text: "We learn the business, the goal and the talent need before we propose a slate.",
  },
  {
    title: "Competence and fit",
    text: "Technical skill is necessary. Cultural fit is what makes the appointment last.",
  },
  {
    title: "Outcome, shared",
    text: "Relationships are built so that risk and return sit with both sides of the mandate.",
  },
  {
    title: "Global reach, local judgement",
    text: "Diaspora networks and local markets are used together, never as substitutes.",
  },
];

export const REQUEST_LABELS: Record<ServiceRequestType, string> = {
  executive_search: "Executive search",
  personnel_outsourcing: "Personnel outsourcing",
  volume_resourcing: "Volume resourcing",
  team_building: "Team building",
  background_checks: "Background checks",
  document_verification: "Document verification",
  training: "Training & workforce development",
};

export const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  submitted: "Submitted",
  in_review: "In review",
  assigned: "Assigned",
  in_progress: "In progress",
  awaiting_client: "Awaiting client",
  completed: "Completed",
  closed: "Closed",
};

export const REGISTRATION_LABELS: Record<RegistrationStatus, string> = {
  submitted: "Submitted",
  confirmed: "Confirmed",
  waitlisted: "Waitlisted",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

export const INDUSTRY_OPTIONS = INDUSTRIES.map((item) => item.title);

export const COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Egypt",
  "Rwanda",
  "Senegal",
  "Côte d'Ivoire",
  "Ethiopia",
  "Tanzania",
  "Uganda",
  "Morocco",
  "United Kingdom",
  "United States",
  "Canada",
  "United Arab Emirates",
  "France",
  "Germany",
  "Other",
];

export const COMPANY_SIZES = ["1–50", "51–200", "201–1,000", "1,001–5,000", "5,000+"];

export function isStaff(accountType: string) {
  return accountType === "admin" || accountType === "super_admin";
}
