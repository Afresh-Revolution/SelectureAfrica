import Link from "next/link";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { Reveal } from "@/components/ui/Reveal";
import { INDUSTRIES, SEARCH_STEPS, SERVICES, SITE } from "@/lib/constants";
import { publishedInsights, publishedPrograms } from "@/lib/queries";
import styles from "./home.module.scss";

export default async function HomePage() {
  const [programs, insights] = await Promise.all([publishedPrograms(), publishedInsights()]);

  return (
    <>
      <section className={`hero-dark ${styles.hero}`}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.copy}>
            <p className="eyebrow" style={{ color: "#e7d3ae" }}>
              Lagos · London · Africa & the diaspora
            </p>
            <h1>Talent, prepared and delivered.</h1>
            <p className="lede">
              Selecture Africa is an executive search and workforce firm for organisations that need
              judgement, not a job board. We find, assess and, where it helps, prepare African professionals
              for the work.
            </p>
            <div className={styles.cta}>
              <Link className="btn btn-primary" href="/register/corporate">
                Hire talent
              </Link>
              <Link className="btn btn-ghost" href="/register/professional">
                Join as a professional
              </Link>
            </div>
          </div>
          <HeroCarousel />
        </div>
        <div className={`container ${styles.briefWrap}`}>
          <aside className={styles.panel}>
            <strong>A senior brief, held properly.</strong>
            <p>
              Every executive search is owned by a consultant, supported by research and subject-matter advisers.
              Outsourcing follows the same discipline through to payroll.
            </p>
            <div className={styles.offices}>
              <div className={styles.office}>
                <span>Lagos</span>
                <p>Ikoyi</p>
                <a href={SITE.lagos.phoneHref}>{SITE.lagos.phone}</a>
              </div>
              <div className={styles.office}>
                <span>London</span>
                <p>EC2A</p>
                <a href={SITE.london.phoneHref}>{SITE.london.phone}</a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="container">
        <div className={styles.strip} aria-label="Sectors">
          {INDUSTRIES.map((item) => (
            <span className={styles.chip} key={item.title}>
              {item.title}
            </span>
          ))}
        </div>
      </div>

      <section className={styles.band}>
        <div className={`container ${styles.split}`}>
          <Reveal>
            <p className="eyebrow">The firm</p>
            <h2>Global reach. Local expertise.</h2>
          </Reveal>
          <Reveal delay={80}>
            <div className="prose">
              <p>
                Selecture Africa is a Lagos-based executive search and recruitment firm with a London office
                and a practice built around intercultural appointments. Clients sit in banking and finance,
                FMCG, technology, oil and gas, management consulting, legal and the public sector.
              </p>
              <p>
                The work is not only to introduce people. It is to understand the business, qualify talent
                for competence and culture, and stay with the process until the hire is closed — or, in
                outsourcing, until the workforce is being managed.
              </p>
              <p>
                <Link href="/about">Read the company story</Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className={styles.bandAlt}>
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Services</p>
              <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.4rem)", marginTop: "0.5rem" }}>What clients instruct us to do</h2>
            </div>
            <Link className="btn btn-line" href="/services">
              All services
            </Link>
          </div>
          <div className="grid-3">
            {SERVICES.map((service, index) => (
              <Reveal key={service.slug} delay={index * 60}>
                <article className="card">
                  <p className="eyebrow">0{index + 1}</p>
                  <h3>{service.title}</h3>
                  <p>{service.summary}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#fff", borderBlock: "1px solid rgba(25,38,61,0.08)" }}>
        <div className="container grid-2">
          <div>
            <p className="eyebrow">Executive search</p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", margin: "0.6rem 0 1rem" }}>Six stages, one owner.</h2>
            <p className="lede">The brochure process is still how mandates are run. The website records the instruction; consultants do the search.</p>
          </div>
          <ol className={styles.steps}>
            {SEARCH_STEPS.map((step) => (
              <li className={styles.step} key={step.n}>
                <b>{step.n}</b>
                <div>
                  <div className={styles.phase}>{step.phase}</div>
                  {step.title}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className={`container ${styles.routes}`}>
          <Link className={`${styles.route} ${styles.primaryRoute}`} href="/employers">
            <div>
              <div className={styles.index}>Primary · Organisations</div>
              <h3>Instruct a search, an outsourcing arrangement, or a workforce programme.</h3>
            </div>
            <span>Become a corporate member →</span>
          </Link>
          <Link className={`${styles.route} ${styles.secondaryRoute}`} href="/professionals">
            <div>
              <div className={styles.index}>Professionals</div>
              <h3>Build a private profile and register for programmes.</h3>
            </div>
            <span>Join as an individual →</span>
          </Link>
        </div>
      </section>

      <section className={styles.bandWarm}>
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Programs</p>
              <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)", marginTop: "0.45rem" }}>Four courses in preparation</h2>
            </div>
            <Link className="btn btn-line" href="/programs">
              View the catalogue
            </Link>
          </div>
          <div className="grid-4">
            {programs.map((program) => (
              <Link key={program.id} href={`/programs/${program.slug}`} className="card" style={{ textDecoration: "none" }}>
                <p className="eyebrow">{program.duration || "Course"}</p>
                <h3>{program.title}</h3>
                <p>{program.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {insights.length > 0 && (
        <section className={styles.bandPaper}>
          <div className="container">
            <div className="section-head">
              <div>
                <p className="eyebrow">Insights</p>
                <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)", marginTop: "0.45rem" }}>Notes from the practice</h2>
              </div>
            </div>
            <div className="grid-3">
              {insights.slice(0, 3).map((article) => (
                <Link key={article.id} href={`/insights/${article.slug}`} className={`card ${styles.article}`}>
                  <span className="badge">{article.category}</span>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
