create table if not exists membership_plans (
  code text primary key,
  name text not null,
  audience text not null check (audience in ('professional', 'corporate')),
  amount_kobo integer not null,
  interval text not null check (interval in ('month', 'year', 'none')),
  summary text not null,
  features text[] not null default '{}',
  paystack_plan_code text,
  sort_order integer not null default 0,
  active boolean not null default true
);

insert into membership_plans (code, name, audience, amount_kobo, interval, summary, features, sort_order)
values
  (
    'professional_member',
    'Member',
    'professional',
    0,
    'none',
    'Profile, a private CV, and a first look at open roles.',
    array[
      'Professional profile and private CV',
      'Browse open roles and see your match',
      'One application on the free plan',
      'Programme registration'
    ],
    1
  ),
  (
    'professional_select',
    'Select',
    'professional',
    2500000,
    'month',
    'Full applications, lessons, checks and certificates.',
    array[
      'Unlimited applications',
      'Lessons and video',
      'Exams and certificates',
      'Fit assessment'
    ],
    2
  ),
  (
    'professional_fellow',
    'Fellow',
    'professional',
    24000000,
    'year',
    'A year of Select, with applications marked priority.',
    array[
      'Everything in Select',
      'Priority marker on applications',
      'Billed once a year'
    ],
    3
  ),
  (
    'corporate_client',
    'Client',
    'corporate',
    0,
    'none',
    'Instruct the firm and keep a draft role on file.',
    array[
      'Organisation profile and service requests',
      'Draft a role before you publish',
      'Programme registration for nominated staff'
    ],
    1
  ),
  (
    'corporate_employer',
    'Employer',
    'corporate',
    8500000,
    'month',
    'Publish roles, follow applicants, and invite matched people.',
    array[
      'Job board publishing',
      'Applicant tracking',
      'Automatic matching and invitations',
      'Fit assessment on applicants'
    ],
    2
  ),
  (
    'corporate_workforce',
    'Workforce',
    'corporate',
    22000000,
    'month',
    'Employer tools plus payroll planning, partners and analytics.',
    array[
      'Everything in Employer',
      'Workforce register and payroll runs',
      'Partner webhooks',
      'Predictive hiring analytics'
    ],
    3
  )
on conflict (code) do nothing;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  plan_code text not null references membership_plans(code),
  status text not null default 'active' check (status in ('active', 'cancelled', 'past_due')),
  paystack_reference text,
  paystack_subscription_code text,
  paystack_customer_code text,
  paystack_email_token text,
  current_period_end timestamptz not null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_reference_idx
  on subscriptions(paystack_reference)
  where paystack_reference is not null;

create index if not exists subscriptions_profile_idx on subscriptions(profile_id, current_period_end desc);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  organization_id uuid references organizations(id) on delete set null,
  plan_code text,
  reference text not null unique,
  amount_kobo integer not null,
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  channel text,
  paid_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  title text not null,
  summary text not null,
  description text not null,
  city text,
  country text,
  employment_type text not null default 'permanent',
  seniority text,
  skills text[] not null default '{}',
  industries text[] not null default '{}',
  min_experience integer,
  headcount integer not null default 1,
  salary_min integer,
  salary_max integer,
  currency text not null default 'NGN',
  diaspora_preferred boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'open', 'paused', 'closed')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_status_idx on jobs(status, published_at desc);
create index if not exists jobs_org_idx on jobs(organization_id, created_at desc);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  cover_note text,
  status text not null default 'applied' check (status in (
    'applied', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected', 'withdrawn'
  )),
  match_score integer not null default 0,
  match_reasons jsonb not null default '[]'::jsonb,
  priority boolean not null default false,
  source text not null default 'member' check (source in ('member', 'invited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, profile_id)
);

create index if not exists applications_job_idx on applications(job_id, created_at desc);
create index if not exists applications_profile_idx on applications(profile_id, created_at desc);

create table if not exists application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  status text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists job_invites (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  invited_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (job_id, profile_id)
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  title text not null,
  summary text not null default '',
  body text not null default '',
  video_url text,
  duration_minutes integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists lessons_program_idx on lessons(program_id, sort_order);

create table if not exists lesson_progress (
  profile_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (profile_id, lesson_id)
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null unique references programs(id) on delete cascade,
  title text not null,
  pass_mark integer not null default 70,
  created_at timestamptz not null default now()
);

create table if not exists exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  prompt text not null,
  options jsonb not null,
  correct_index integer not null,
  sort_order integer not null default 0
);

create table if not exists exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  score integer not null,
  passed boolean not null,
  answers jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now()
);

create index if not exists exam_attempts_profile_idx on exam_attempts(profile_id, submitted_at desc);

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  program_id uuid not null references programs(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  holder_name text not null,
  program_title text not null,
  issued_at timestamptz not null default now(),
  unique (program_id, profile_id)
);

create table if not exists workforce_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text,
  role_title text not null,
  employment_type text not null default 'permanent',
  country text,
  start_date date,
  status text not null default 'active' check (status in ('active', 'on_leave', 'offboarded')),
  monthly_gross_kobo integer not null default 0,
  bank_name text,
  account_last4 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workforce_org_idx on workforce_members(organization_id, full_name);

create table if not exists payroll_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  period_label text not null,
  status text not null default 'draft' check (status in ('draft', 'approved')),
  total_gross_kobo integer not null default 0,
  total_deductions_kobo integer not null default 0,
  total_net_kobo integer not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists payroll_lines (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references payroll_runs(id) on delete cascade,
  workforce_member_id uuid references workforce_members(id) on delete set null,
  full_name text not null,
  role_title text not null,
  gross_kobo integer not null,
  pension_kobo integer not null,
  withholding_kobo integer not null,
  net_kobo integer not null
);

create table if not exists partner_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  provider text not null check (provider in ('webhook', 'slack', 'hris')),
  label text not null,
  endpoint_url text,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  last_event_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table if not exists partner_events (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references partner_integrations(id) on delete cascade,
  event text not null,
  status text not null,
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  organization_id uuid references organizations(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  kind text not null,
  score integer not null,
  band text not null,
  narrative text not null,
  factors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assessments_profile_idx on assessments(profile_id, created_at desc);
create index if not exists assessments_job_idx on assessments(job_id, created_at desc);

insert into lessons (program_id, title, summary, body, duration_minutes, sort_order)
select p.id,
  'How a workforce brief is written',
  'The brief is the standard the rest of the search is judged against.',
  'A useful brief names the work, the context it sits in, and the proof you will accept. Title and headcount are not enough. Write what the person will be accountable for in the first two quarters, which decisions they will take, and which markets they must already understand. Selecture uses that brief as the screen for both retained search and roles published on the job board.',
  12,
  1
from programs p
where p.slug = 'workforce-readiness'
  and not exists (
    select 1 from lessons l where l.program_id = p.id and l.sort_order = 1
  );

insert into lessons (program_id, title, summary, body, duration_minutes, sort_order)
select p.id,
  'What matching can and cannot see',
  'A match score is a reading of the profile against the role, not a hiring decision.',
  'The match compares skills, industries, location and years of experience with the role. It explains the overlaps it found. It does not read character, and it does not replace a conversation. Private CVs stay private until a professional applies. Employers see an anonymised suggestion and can invite the person to look at the role.',
  10,
  2
from programs p
where p.slug = 'workforce-readiness'
  and not exists (
    select 1 from lessons l where l.program_id = p.id and l.sort_order = 2
  );

insert into lessons (program_id, title, summary, body, duration_minutes, sort_order)
select p.id,
  'Payroll planning versus payroll filing',
  'A planning run is a working figure for the month. It is not a statutory return.',
  'The workforce register keeps people, roles and a monthly gross. A payroll run estimates pension at 8 percent and an illustrative withholding at 10 percent so a client can see a net figure. Those rates are planning assumptions. They are not tax advice, and they are not a filing to any revenue authority. Bank details are limited to the last four digits.',
  8,
  3
from programs p
where p.slug = 'workforce-readiness'
  and not exists (
    select 1 from lessons l where l.program_id = p.id and l.sort_order = 3
  );

insert into exams (program_id, title, pass_mark)
select p.id, 'Workforce readiness check', 70
from programs p
where p.slug = 'workforce-readiness'
  and not exists (select 1 from exams e where e.program_id = p.id);

insert into exam_questions (exam_id, prompt, options, correct_index, sort_order)
select e.id,
  'What should a workforce brief state before sourcing begins?',
  '["Only the job title","The work, the context, and the standard of proof","A public salary band","The number of agencies to invite"]'::jsonb,
  1,
  1
from exams e
join programs p on p.id = e.program_id
where p.slug = 'workforce-readiness'
  and not exists (select 1 from exam_questions q where q.exam_id = e.id and q.sort_order = 1);

insert into exam_questions (exam_id, prompt, options, correct_index, sort_order)
select e.id,
  'When can an employer see a candidate name on a suggested match?',
  '["As soon as the score is calculated","After the professional applies or is already an applicant","When the CV is uploaded","Never"]'::jsonb,
  1,
  2
from exams e
join programs p on p.id = e.program_id
where p.slug = 'workforce-readiness'
  and not exists (select 1 from exam_questions q where q.exam_id = e.id and q.sort_order = 2);

insert into exam_questions (exam_id, prompt, options, correct_index, sort_order)
select e.id,
  'What is a payroll run in this platform?',
  '["A statutory filing","A planning estimate of gross, pension, withholding and net","A payment instruction to a bank","A tax clearance certificate"]'::jsonb,
  1,
  3
from exams e
join programs p on p.id = e.program_id
where p.slug = 'workforce-readiness'
  and not exists (select 1 from exam_questions q where q.exam_id = e.id and q.sort_order = 3);
