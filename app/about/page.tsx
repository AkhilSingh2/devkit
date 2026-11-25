import type { Metadata } from "next";
import { navPages } from "@/lib/registry";

export const metadata: Metadata = {
  title: "About",
  description: "DevKit is a static, offline-capable toolbox. Every converter and parser runs in your browser.",
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <article className="tool-page">
      <p className="eyebrow">About</p>
      <h1>About DevKit</h1>
      <p className="lede">DevKit is a set of {navPages.length} developer tools that run entirely on your device.</p>
      <p>The site is a static export. It can be hosted on GitHub Pages or Vercel, and a service worker caches pages you have opened so the same tools work offline.</p>
      <p>Inputs stay in the tab unless you copy a share link. A share link keeps the input in the URL hash. Browsers do not send the hash to the server with the page request. Anyone you send the link to can still read it, so do not share secrets that way.</p>
      <p>There is no account, no default analytics, and no default advertising. Optional Plausible analytics and a Carbon ad slot exist behind build flags and are off unless you turn them on.</p>
    </article>
  );
}
