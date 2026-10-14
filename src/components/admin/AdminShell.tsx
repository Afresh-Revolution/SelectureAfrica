"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/features/auth/actions";
import type { SessionUser } from "@/types";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/requests", label: "Service requests" },
  { href: "/admin/organizations", label: "Organisations" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/programs", label: "Programmes" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/insights", label: "Insights" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/audit", label: "Audit log" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = user.accountType === "super_admin" ? [...links, { href: "/admin/team", label: "Administrators" }] : links;
  return (
    <div className="admin-frame">
      <aside className="admin-side">
        <Link href="/admin" className="admin-brand">
          Selecture
        </Link>
        <nav aria-label="Administration">
          {items.map((item) => {
            const current = isCurrent(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <div>
            <strong>{user.fullName}</strong>
            <div className="muted">{user.accountType === "super_admin" ? "Super administrator" : "Administrator"}</div>
          </div>
          <form action={signOut}>
            <button className="btn btn-line" type="submit">Sign out</button>
          </form>
        </header>
        <main id="main">{children}</main>
      </div>
    </div>
  );
}
