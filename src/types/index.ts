export type AccountType = "corporate" | "professional" | "admin" | "super_admin";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  accountType: AccountType;
  organizationId: string | null;
  organizationName: string | null;
  orgRole: "owner" | "member" | null;
};

export type ServiceRequestType =
  | "executive_search"
  | "personnel_outsourcing"
  | "volume_resourcing"
  | "team_building"
  | "background_checks"
  | "document_verification"
  | "training";

export type ServiceRequestStatus =
  | "submitted"
  | "in_review"
  | "assigned"
  | "in_progress"
  | "awaiting_client"
  | "completed"
  | "closed";

export type RegistrationStatus = "submitted" | "confirmed" | "waitlisted" | "declined" | "withdrawn";
