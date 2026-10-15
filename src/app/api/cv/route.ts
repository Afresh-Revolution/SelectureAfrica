import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const url = new URL(request.url);
  const requested = url.searchParams.get("profile");
  const staff = user.accountType === "admin" || user.accountType === "super_admin";
  const profileId = requested && staff ? requested : requested && user.accountType === "corporate" ? requested : user.id;
  if (profileId !== user.id && !staff) {
    if (!(user.accountType === "corporate" && user.organizationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const allowed = await sql<{ ok: number }[]>`
      select 1 as ok
      from applications a
      join jobs j on j.id = a.job_id
      where a.profile_id = ${profileId} and j.organization_id = ${user.organizationId}
      limit 1
    `;
    if (!allowed.length) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await sql<{ fileName: string; mimeType: string; content: Buffer }[]>`
    select file_name, mime_type, content from cv_documents where profile_id = ${profileId} limit 1
  `;
  const file = rows[0];
  if (!file) return NextResponse.json({ error: "No CV stored" }, { status: 404 });

  return new NextResponse(new Uint8Array(file.content), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
