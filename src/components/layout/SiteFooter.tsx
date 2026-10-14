"use client";

import { useActionState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { subscribeNewsletter } from "@/features/membership/actions";
import styles from "./SiteFooter.module.scss";

export function SiteFooter() {
  const [state, action, pending] = useActionState(subscribeNewsletter, null);

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div>
          <div className={styles.lockup}>
            <img className={styles.mark} src="/brand/logo.png" alt="" width={56} height={62} />
            <div className={styles.brand}>Selecture Africa</div>
          </div>
          <p className={styles.muted}>
            An Africa-focused talent solutions firm. Recruitment, outsourcing and professional preparation,
            delivered from Lagos and London.
          </p>
        </div>
        <div className={styles.col}>
          <h2>Explore</h2>
          <Link href="/services">Services</Link>
          <Link href="/employers">For employers</Link>
          <Link href="/professionals">For professionals</Link>
          <Link href="/programs">Programs</Link>
          <Link href="/insights">Insights</Link>
        </div>
        <div className={styles.col}>
          <h2>Lagos</h2>
          {SITE.lagos.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
          <a href={SITE.lagos.phoneHref}>{SITE.lagos.phone}</a>
          <h2 style={{ marginTop: "1rem" }}>London</h2>
          {SITE.london.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
          <a href={SITE.london.phoneHref}>{SITE.london.phone}</a>
        </div>
        <div>
          <h2 className={styles.label}>Briefing list</h2>
          <p className={styles.muted}>Occasional notes on talent markets. No noise.</p>
          <form className={styles.form} action={action}>
            <label className="honeypot" aria-hidden>
              Website
              <input name="company_website" tabIndex={-1} autoComplete="off" />
            </label>
            <label className="sr-only" htmlFor="footer-email">
              Email
            </label>
            <input id="footer-email" name="email" type="email" required placeholder="Work email" />
            <button className="btn btn-gold" disabled={pending} type="submit">
              {pending ? "Joining" : "Join"}
            </button>
          </form>
          <p className={styles.note} role="status">
            {state?.error || state?.success}
          </p>
        </div>
      </div>
      <div className={`container ${styles.base}`}>
        <span>© {new Date().getFullYear()} Selecture Africa Ltd</span>
        <span>
          <Link href="/privacy">Privacy</Link>
          {" · "}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </span>
      </div>
    </footer>
  );
}
