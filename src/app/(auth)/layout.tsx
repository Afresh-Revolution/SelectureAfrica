import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <aside className="auth-story">
        <Link className="auth-brand" href="/">
          <img src="/brand/logo.png" alt="" width={40} height={44} />
          Selecture Africa
        </Link>
        <div>
          <p className="eyebrow" style={{ color: "#e7d3ae" }}>Talent Delivered</p>
          <h1>A private door for clients and professionals.</h1>
          <p>Organisations instruct the work. Professionals keep a profile with the firm. Staff review both from the back office.</p>
        </div>
        <p>Lagos · London</p>
      </aside>
      <div className="auth-panel">
        <main id="main">{children}</main>
      </div>
    </div>
  );
}
