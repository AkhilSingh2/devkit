import { HomeFinder } from "@/components/home-finder";
import { navPages, pages } from "@/lib/registry";
import { sitePath } from "@/lib/paths";
import { absoluteUrl, site } from "@/lib/site";

export default function HomePage() {
  const guides = pages.filter((page) => !page.nav);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "DevKit",
        url: absoluteUrl("/"),
        description: site.description,
      },
      {
        "@type": "ItemList",
        itemListElement: navPages.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: page.name,
          url: absoluteUrl(`/${page.slug}/`),
        })),
      },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="hero">
        <p className="eyebrow">Private by default</p>
        <h1>DevKit</h1>
        <p className="lede">
          A toolbox for JSON, YAML, cron, JWTs, diffs, and the small jobs that usually mean another tab. Every tool runs in your browser. Nothing you paste is uploaded.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href={sitePath("json-formatter")}>Format JSON</a>
          <a className="btn" href={sitePath("yaml-to-json")}>Convert YAML</a>
          <a className="btn" href={sitePath("jwt-decoder")}>Decode a JWT</a>
        </div>
      </header>
      <section className="section" aria-labelledby="tools-heading">
        <h2 id="tools-heading">Tools</h2>
        <HomeFinder tools={navPages} />
      </section>
      <section className="section" aria-labelledby="guides-heading">
        <h2 id="guides-heading">Common jobs</h2>
        <div className="guide-grid">
          {guides.map((page) => (
            <a key={page.slug} className="card" href={sitePath(page.slug)}>
              <h3>{page.h1}</h3>
              <p>{page.description}</p>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
