"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/features/auth/actions";
import type { SessionUser } from "@/types";

const corporateNav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/organization", label: "Organisation" },
  { href: "/dashboard/requests", label: "Requests" },
  { href: "/dashboard/submissions", label: "Programmes" },
  { href: "/dashboard/preferences", label: "Preferences" },
];

const professionalNav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/submissions", label: "Submissions" },
  { href: "/dashboard/preferences", label: "Preferences" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MemberShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const links = user.accountType === "corporate" ? corporateNav : professionalNav;
  return (
    <div className="member-shell">
      <div className="container">
        <header className="member-top">
          <Link className="member-brand" href="/">
            Selecture Africa
          </Link>
          <div className="member-user">
            <span className="muted">{user.fullName}</span>
            <form action={signOut}>
              <button className="btn btn-line" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <nav className="member-nav" aria-label="Account">
          {links.map((link) => {
            const current = isCurrent(pathname, link.href);
            return (
              <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <main id="main" className="member-main">
          {children}
        </main>
      </div>
    </div>
  );
}
