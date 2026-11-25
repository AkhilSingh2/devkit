import { AdSlot } from "@/components/ad-slot";
import { ToolClient } from "@/components/tool-client";
import { contentFor } from "@/lib/content";
import { childPages, getPage, type PageDef } from "@/lib/registry";
import { regexCheatSheet } from "@/lib/regex/regex";
import { absoluteUrl } from "@/lib/site";
import { sitePath } from "@/lib/paths";

export function ToolScreen({ page }: { page: PageDef }) {
  const body = contentFor(page.slug);
  if (!body) return null;
  const children = childPages(page.slug);
  const related = page.related.map((slug) => getPage(slug)).filter((item): item is PageDef => Boolean(item));
  const parentSlug = page.slug.includes("/") ? page.slug.slice(0, page.slug.lastIndexOf("/")) : "";
  const parent = parentSlug ? getPage(parentSlug) : undefined;
  const url = absoluteUrl(`/${page.slug}/`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: page.h1,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        url,
        description: page.description,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        browserRequirements: "Requires JavaScript. Runs locally in the browser.",
      },
      {
        "@type": "FAQPage",
        mainEntity: body.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "DevKit", item: absoluteUrl("/") },
          ...(parent ? [{ "@type": "ListItem", position: 2, name: parent.h1, item: absoluteUrl(`/${parent.slug}/`) }] : []),
          { "@type": "ListItem", position: parent ? 3 : 2, name: page.h1, item: url },
        ],
      },
    ],
  };

  return (
    <article className="tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="eyebrow">{page.category}</p>
      <h1>{page.h1}</h1>
      <p className="lede">{page.description}</p>
      <ToolClient id={page.id} preset={page.preset} />
      <AdSlot />
      <section className="section">
        <h2>How to use it</h2>
        {body.howTo.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <ol className="steps">
          {body.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </section>
      {children.length ? (
        <section className="section">
          <h2>Guides</h2>
          <div className="guide-grid">
            {children.map((child) => (
              <a key={child.slug} className="card" href={sitePath(child.slug)}>
                <h3>{child.h1}</h3>
                <p>{child.description}</p>
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {page.slug === "regex-tester" ? (
        <section className="section cheat">
          <h2>Regex cheat sheet</h2>
          <table>
            <thead><tr><th>Token</th><th>Meaning</th></tr></thead>
            <tbody>
              {regexCheatSheet.map((row) => (
                <tr key={row.token}><td><code>{row.token}</code></td><td>{row.meaning}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
      <section className="section faq">
        <h2>Questions</h2>
        {body.faqs.map((faq) => (
          <details key={faq.q}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </section>
      <section className="section">
        <h2>Related tools</h2>
        <div className="related">
          {related.map((item) => (
            <a key={item.slug} className="btn" href={sitePath(item.slug)}>{item.name}</a>
          ))}
        </div>
      </section>
    </article>
  );
}
