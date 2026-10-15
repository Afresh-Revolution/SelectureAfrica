import { sql } from "@/lib/db";

export async function hiringAnalytics(organizationId?: string | null) {
  const org = organizationId ?? null;
  const [stages, weekly, skills, supply, payroll, learning] = await Promise.all([
    sql<{ status: string; count: string }[]>`
      select a.status, count(*)::text as count
      from applications a
      join jobs j on j.id = a.job_id
      where (${org}::uuid is null or j.organization_id = ${org})
      group by a.status
    `,
    sql<{ week: string; count: string }[]>`
      select to_char(date_trunc('week', a.created_at), 'YYYY-MM-DD') as week, count(*)::text as count
      from applications a
      join jobs j on j.id = a.job_id
      where a.created_at > now() - interval '90 days'
        and (${org}::uuid is null or j.organization_id = ${org})
      group by 1
      order by 1
    `,
    sql<{ skill: string; demand: string }[]>`
      select skill, count(*)::text as demand
      from jobs j, unnest(j.skills) as skill
      where j.status = 'open'
        and (${org}::uuid is null or j.organization_id = ${org})
      group by skill
      order by count(*) desc
      limit 8
    `,
    sql<{ skill: string; supply: string }[]>`
      select skill, count(*)::text as supply
      from professional_profiles, unnest(skills) as skill
      where visibility = 'selecture_only'
      group by skill
    `,
    sql<{ total: string; runs: string }[]>`
      select coalesce(sum(total_net_kobo), 0)::text as total, count(*)::text as runs
      from payroll_runs
      where status = 'approved'
        and (${org}::uuid is null or organization_id = ${org})
        and created_at > now() - interval '180 days'
    `,
    sql<{ completed: string; enrolled: string }[]>`
      select
        (select count(*) from certificates)::text as completed,
        (select count(*) from program_registrations where status = 'confirmed')::text as enrolled
    `,
  ]);

  const byStatus = Object.fromEntries(stages.map((row) => [row.status, Number(row.count)]));
  const decided = (byStatus.hired ?? 0) + (byStatus.rejected ?? 0);
  const hireRate = decided ? Math.round(((byStatus.hired ?? 0) / decided) * 100) : null;
  const weeklyCounts = weekly.map((row) => Number(row.count));
  const average = weeklyCounts.length
    ? weeklyCounts.reduce((sum, value) => sum + value, 0) / weeklyCounts.length
    : 0;
  const supplyMap = new Map(supply.map((row) => [row.skill.toLowerCase(), Number(row.supply)]));
  const gaps = skills.map((row) => ({
    skill: row.skill,
    demand: Number(row.demand),
    supply: supplyMap.get(row.skill.toLowerCase()) ?? 0,
  }));

  return {
    byStatus,
    applications: stages.reduce((sum, row) => sum + Number(row.count), 0),
    hireRate,
    weekly: weekly.map((row) => ({ week: row.week, count: Number(row.count) })),
    projectedNextMonth: Math.round(average * 4),
    gaps,
    payrollNetKobo: Number(payroll[0]?.total ?? 0),
    payrollRuns: Number(payroll[0]?.runs ?? 0),
    certificates: Number(learning[0]?.completed ?? 0),
    enrolled: Number(learning[0]?.enrolled ?? 0),
  };
}
