"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/features/auth/actions";
import { writeAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { getEntitlements, hasCap } from "@/lib/billing";
import { sql } from "@/lib/db";
import { estimatePay, safeWebhookUrl } from "@/lib/payroll";
import { emptyToNull, partnerSchema, payrollRunSchema, workforceSchema } from "@/lib/validators";

async function requireWorkforce() {
  const user = await requireUser();
  if (!user.organizationId) return { user, error: "An organisation account is required." as const };
  const entitlements = await getEntitlements(user);
  if (!hasCap(entitlements, "payroll")) {
    return { user, error: "Payroll, partners and the workforce register need the Workforce plan." as const };
  }
  return { user, error: null };
}

export async function saveWorkforceMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requireWorkforce();
  if (error || !user.organizationId) return { error: error ?? "Organisation required." };
  const parsed = workforceSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    roleTitle: formData.get("roleTitle"),
    employmentType: formData.get("employmentType"),
    country: formData.get("country"),
    startDate: formData.get("startDate"),
    status: formData.get("status"),
    monthlyGross: formData.get("monthlyGross"),
    bankName: formData.get("bankName"),
    accountLast4: formData.get("accountLast4"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the person." };
  const grossKobo = Math.round(parsed.data.monthlyGross * 100);
  const memberId = String(formData.get("memberId") ?? "");
  if (memberId) {
    await sql`
      update workforce_members set
        full_name = ${parsed.data.fullName},
        email = ${emptyToNull(parsed.data.email)},
        role_title = ${parsed.data.roleTitle},
        employment_type = ${parsed.data.employmentType},
        country = ${emptyToNull(parsed.data.country)},
        start_date = ${parsed.data.startDate || null},
        status = ${parsed.data.status},
        monthly_gross_kobo = ${grossKobo},
        bank_name = ${emptyToNull(parsed.data.bankName)},
        account_last4 = ${emptyToNull(parsed.data.accountLast4)},
        updated_at = now()
      where id = ${memberId} and organization_id = ${user.organizationId}
    `;
  } else {
    await sql`
      insert into workforce_members (
        organization_id, full_name, email, role_title, employment_type, country,
        start_date, status, monthly_gross_kobo, bank_name, account_last4
      ) values (
        ${user.organizationId},
        ${parsed.data.fullName},
        ${emptyToNull(parsed.data.email)},
        ${parsed.data.roleTitle},
        ${parsed.data.employmentType},
        ${emptyToNull(parsed.data.country)},
        ${parsed.data.startDate || null},
        ${parsed.data.status},
        ${grossKobo},
        ${emptyToNull(parsed.data.bankName)},
        ${emptyToNull(parsed.data.accountLast4)}
      )
    `;
  }
  revalidatePath("/dashboard/workforce");
  return { success: "Workforce record saved." };
}

async function notifyPartners(organizationId: string, event: string, payload: Record<string, unknown>) {
  const hooks = await sql<{ id: string; endpointUrl: string | null }[]>`
    select id, endpoint_url from partner_integrations
    where organization_id = ${organizationId} and status = 'connected' and endpoint_url is not null
  `;
  await Promise.all(
    hooks.map(async (hook) => {
      const endpoint = hook.endpointUrl ? safeWebhookUrl(hook.endpointUrl) : null;
      if (!endpoint) return;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, ...payload }),
          redirect: "error",
          signal: AbortSignal.timeout(8000),
        });
        await sql`
          insert into partner_events (integration_id, event, status, detail)
          values (${hook.id}, ${event}, ${response.ok ? "delivered" : "failed"}, ${`HTTP ${response.status}`})
        `;
        await sql`
          update partner_integrations set last_event_at = now(), last_error = ${response.ok ? null : `HTTP ${response.status}`}, status = ${response.ok ? "connected" : "error"}
          where id = ${hook.id}
        `;
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Delivery failed.";
        await sql`
          insert into partner_events (integration_id, event, status, detail)
          values (${hook.id}, ${event}, 'failed', ${detail})
        `;
        await sql`update partner_integrations set status = 'error', last_error = ${detail}, last_event_at = now() where id = ${hook.id}`;
      }
    }),
  );
}

export async function createPayrollRun(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requireWorkforce();
  if (error || !user.organizationId) return { error: error ?? "Organisation required." };
  const parsed = payrollRunSchema.safeParse({ periodLabel: formData.get("periodLabel") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Name the period." };

  const people = await sql<{ id: string; fullName: string; roleTitle: string; monthlyGrossKobo: number }[]>`
    select id, full_name, role_title, monthly_gross_kobo
    from workforce_members
    where organization_id = ${user.organizationId} and status = 'active'
  `;
  if (!people.length) return { error: "Add active people before running payroll." };

  const lines = people.map((person) => ({ person, pay: estimatePay(person.monthlyGrossKobo) }));
  const totals = lines.reduce(
    (sum, line) => ({
      gross: sum.gross + line.pay.gross,
      deductions: sum.deductions + line.pay.pension + line.pay.withholding,
      net: sum.net + line.pay.net,
    }),
    { gross: 0, deductions: 0, net: 0 },
  );

  const run = await sql<{ id: string }[]>`
    insert into payroll_runs (
      organization_id, period_label, status, total_gross_kobo, total_deductions_kobo, total_net_kobo, created_by
    ) values (
      ${user.organizationId}, ${parsed.data.periodLabel}, 'draft', ${totals.gross}, ${totals.deductions}, ${totals.net}, ${user.id}
    )
    returning id
  `;
  for (const line of lines) {
    await sql`
      insert into payroll_lines (
        run_id, workforce_member_id, full_name, role_title, gross_kobo, pension_kobo, withholding_kobo, net_kobo
      ) values (
        ${run[0].id},
        ${line.person.id},
        ${line.person.fullName},
        ${line.person.roleTitle},
        ${line.pay.gross},
        ${line.pay.pension},
        ${line.pay.withholding},
        ${line.pay.net}
      )
    `;
  }
  revalidatePath("/dashboard/payroll");
  return { success: "Draft payroll run created. Review it before approval." };
}

export async function approvePayrollRun(formData: FormData) {
  const { user, error } = await requireWorkforce();
  if (error || !user.organizationId) return;
  const runId = String(formData.get("runId") ?? "");
  const rows = await sql<{ id: string; periodLabel: string; totalNetKobo: number; status: string }[]>`
    select id, period_label, total_net_kobo, status
    from payroll_runs
    where id = ${runId} and organization_id = ${user.organizationId}
    limit 1
  `;
  const run = rows[0];
  if (!run || run.status === "approved") return;
  await sql`
    update payroll_runs set status = 'approved', approved_at = now()
    where id = ${run.id}
  `;
  await writeAudit({ actorId: user.id, action: "payroll.approve", entityType: "payroll_run", entityId: run.id });
  await notifyPartners(user.organizationId, "payroll.approved", {
    period: run.periodLabel,
    netKobo: run.totalNetKobo,
    organizationId: user.organizationId,
  });
  revalidatePath("/dashboard/payroll");
  revalidatePath(`/dashboard/payroll/${run.id}`);
}

export async function savePartner(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requireWorkforce();
  if (error || !user.organizationId) return { error: error ?? "Organisation required." };
  if (!hasCap(await getEntitlements(user), "partners")) return { error: "Partner connections need the Workforce plan." };
  const parsed = partnerSchema.safeParse({
    provider: formData.get("provider"),
    label: formData.get("label"),
    endpointUrl: formData.get("endpointUrl"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the connection." };
  const endpoint = safeWebhookUrl(parsed.data.endpointUrl);
  if (!endpoint) return { error: "Use a public https address. Private and local addresses are refused." };

  await sql`
    insert into partner_integrations (organization_id, provider, label, endpoint_url, status)
    values (${user.organizationId}, ${parsed.data.provider}, ${parsed.data.label}, ${endpoint}, 'connected')
    on conflict (organization_id, provider) do update set
      label = excluded.label,
      endpoint_url = excluded.endpoint_url,
      status = 'connected',
      last_error = null
  `;
  revalidatePath("/dashboard/partners");
  return { success: "Partner saved. A test event can be sent from this page." };
}

export async function testPartner(formData: FormData) {
  const { user, error } = await requireWorkforce();
  if (error || !user.organizationId) return;
  const provider = String(formData.get("provider") ?? "");
  await notifyPartners(user.organizationId, "selecture.ping", {
    provider,
    organizationId: user.organizationId,
  });
  revalidatePath("/dashboard/partners");
}
