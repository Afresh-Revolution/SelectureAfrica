import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { formatDate } from "@/lib/format";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return { title: `Certificate ${code}` };
}

export default async function CertificatePage({ params }: Props) {
  const { code } = await params;
  const rows = await sql<{ holderName: string; programTitle: string; issuedAt: string; code: string }[]>`
    select holder_name, program_title, issued_at, code
    from certificates
    where lower(code) = lower(${code})
    limit 1
  `;
  const certificate = rows[0];
  if (!certificate) notFound();
  return (
    <article className="section">
      <div className="container-narrow card" style={{ display: "grid", gap: "0.8rem" }}>
        <p className="eyebrow">Certificate</p>
        <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)" }}>{certificate.programTitle}</h1>
        <p className="lede">Issued to {certificate.holderName} on {formatDate(certificate.issuedAt)}.</p>
        <p>Reference {certificate.code}. This page confirms the certificate was issued by Selecture Africa.</p>
      </div>
    </article>
  );
}
