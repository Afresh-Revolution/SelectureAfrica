import { sql } from "@/lib/db";

export async function writeAudit(input: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await sql`
    insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      ${input.actorId},
      ${input.action},
      ${input.entityType},
      ${input.entityId ?? null},
      ${sql.json((input.metadata ?? {}) as never)}
    )
  `;
}
