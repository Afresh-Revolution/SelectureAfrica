import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container-narrow">
        <p className="eyebrow">404</p>
        <h1 style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)", margin: "0.4rem 0 1rem" }}>This page is not on the brief.</h1>
        <Link className="btn btn-navy" href="/">
          Return home
        </Link>
      </div>
    </section>
  );
}
