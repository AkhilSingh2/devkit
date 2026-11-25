import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support",
  description: "DevKit is free. You can sponsor the project when a public sponsor link is configured.",
  alternates: { canonical: "/support/" },
};

export default function SupportPage() {
  return (
    <article className="tool-page">
      <p className="eyebrow">Support</p>
      <h1>Support DevKit</h1>
      <p>The tools are free to use. If they save you time, consider sponsoring the project.</p>
      {site.sponsorUrl ? (
        <p><a className="btn btn-primary" href={site.sponsorUrl}>Sponsor</a></p>
      ) : (
        <p>A sponsor button appears here when the site is built with NEXT_PUBLIC_SPONSOR_URL. Until then, this page is the support link in the header and footer.</p>
      )}
      <p>Bugs and ideas belong in the project repository. Please do not include tokens, customer data, or private URLs in an example.</p>
    </article>
  );
}
