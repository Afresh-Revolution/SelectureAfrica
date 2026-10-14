"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV } from "@/lib/constants";
import styles from "./SiteHeader.module.scss";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
          <Image className={styles.mark} src="/brand/logo.png" alt="" width={72} height={80} priority />
          <span className={styles.word}>
            <strong>Selecture Africa</strong>
            <small>Talent Delivered</small>
          </span>
        </Link>
        <button
          className={styles.menuBtn}
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={`${styles.burger} ${open ? styles.burgerOpen : ""}`} />
        </button>
        <div className={`${styles.panel} ${open ? styles.open : ""}`}>
          <nav id="site-nav" className={styles.nav} aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={styles.actions}>
            {signedIn ? (
              <Link className="btn btn-navy" href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link className="btn btn-line" href="/sign-in" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link className="btn btn-primary" href="/register/corporate" onClick={() => setOpen(false)}>
                  Hire talent
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
