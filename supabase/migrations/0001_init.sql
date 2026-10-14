create extension if not exists pgcrypto;

do $$ begin
  create type account_type as enum ('corporate', 'professional', 'admin', 'super_admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type org_member_role as enum ('owner', 'member');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type service_request_type as enum (
    'executive_search',
    'personnel_outsourcing',
    'volume_resourcing',
    'team_building',
    'background_checks',
    'document_verification',
    'training'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type service_request_status as enum (
    'submitted',
    'in_review',
    'assigned',
    'in_progress',
    'awaiting_client',
    'completed',
    'closed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type registration_status as enum (
    'submitted',
    'confirmed',
    'waitlisted',
    'declined',
    'withdrawn'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type profile_visibility as enum ('private', 'selecture_only');
exception when duplicate_object then null;
end $$;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  phone text,
  account_type account_type not null,
  email_verified_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_profile_idx on sessions(profile_id);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  website text,
  country text,
  city text,
  size_band text,
  about text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role org_member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create unique index if not exists organization_members_one_org
  on organization_members(profile_id);

create table if not exists organization_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  created_at timestamptz not null default now()
);

create table if not exists professional_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  headline text,
  summary text,
  city text,
  country text,
  diaspora boolean not null default false,
  skills text[] not null default '{}',
  experience_years integer,
  industries text[] not null default '{}',
  linkedin_url text,
  visibility profile_visibility not null default 'selecture_only',
  updated_at timestamptz not null default now()
);

create table if not exists cv_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  content bytea not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  organization_id uuid not null references organizations(id) on delete cascade,
  submitted_by uuid not null references profiles(id) on delete restrict,
  request_type service_request_type not null,
  title text not null,
  description text not null,
  location text,
  headcount integer,
  urgency text not null default 'standard',
  status service_request_status not null default 'submitted',
  assigned_to uuid references profiles(id) on delete set null,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_requests_org_idx on service_requests(organization_id);
create index if not exists service_requests_status_idx on service_requests(status);

create table if not exists request_updates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  status service_request_status,
  message text not null,
  visible_to_client boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  description text not null,
  duration text,
  format text,
  audience text,
  status text not null default 'published',
  starts_on date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists program_registrations (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  motivation text,
  status registration_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, profile_id)
);

create table if not exists notification_preferences (
  profile_id uuid primary key references profiles(id) on delete cascade,
  newsletter boolean not null default true,
  product_updates boolean not null default true,
  request_alerts boolean not null default true,
  consent_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table if not exists newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  source text,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  topic text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body text not null,
  category text not null,
  published boolean not null default false,
  published_at timestamptz,
  author_name text not null default 'Selecture Africa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  cloudinary_id text,
  url text not null,
  kind text not null default 'image',
  alt text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_profile_idx on notifications(profile_id, created_at desc);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on audit_logs(created_at desc);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists login_attempts_email_idx on login_attempts(email, attempted_at desc);

create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);
