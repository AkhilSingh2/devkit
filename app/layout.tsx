import type { Metadata, Viewport } from "next";
import { ClearHistoryButton, Header, ServiceWorker } from "@/components/chrome";
import { navPages, pages } from "@/lib/registry";
import { sitePath } from "@/lib/paths";
import { analyticsActive, site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s · DevKit" },
  description: site.description,
  applicationName: "DevKit",
  authors: [{ name: "DevKit" }],
  creator: "DevKit",
  keywords: ["developer tools", "json formatter", "yaml to json", "jwt decoder", "regex tester", "diff checker"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "DevKit",
    title: site.title,
    description: site.description,
    url: "/",
    images: [{ url: "/og/home.png", width: 1200, height: 630, alt: "DevKit, private developer tools in the browser" }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: ["/og/home.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
  colorScheme: "dark",
};

const groups = [...new Set(navPages.map((page) => page.category))];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("devkit.theme");var r=document.documentElement;if(t==="light"){r.classList.remove("dark");r.classList.add("light");}}catch(e){}',
          }}
        />
        {analyticsActive() ? (
          <script defer data-domain={site.analytics.domain} src={site.analytics.src} />
        ) : null}
      </head>
      <body>
        <a className="skip" href="#content">Skip to content</a>
        <Header />
        <main id="content" className="shell">
          <noscript>
            <p className="noscript">The interactive tools need JavaScript. They still run on your device, and the guides below are readable without it.</p>
          </noscript>
          {children}
        </main>
        <footer className="site-footer">
          <div className="shell footer-grid">
            {groups.map((group) => (
              <nav key={group} aria-label={group}>
                <p className="footer-title">{group}</p>
                {navPages.filter((page) => page.category === group).map((page) => (
                  <a key={page.slug} href={sitePath(page.slug)}>{page.name}</a>
                ))}
              </nav>
            ))}
            <nav aria-label="About">
              <p className="footer-title">DevKit</p>
              <a href={sitePath("about")}>About</a>
              <a href={sitePath("privacy")}>Privacy</a>
              <a href={sitePath("support")}>Support</a>
              <a href={sitePath("cron/every-5-minutes")}>Every 5 minutes</a>
              <a href={sitePath("yaml-to-json/kubernetes")}>Kubernetes YAML</a>
              <ClearHistoryButton />
            </nav>
          </div>
          <div className="shell legal">
            <p>DevKit runs in your browser. {pages.length} pages, no account, no upload. {site.sponsorUrl ? <a href={site.sponsorUrl}>Sponsor the project</a> : <a href={sitePath("support")}>Support the project</a>}</p>
          </div>
        </footer>
        <ServiceWorker />
      </body>
    </html>
  );
}
