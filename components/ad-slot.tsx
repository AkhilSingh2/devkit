import Script from "next/script";
import { adsActive, site } from "@/lib/site";

export function AdSlot() {
  if (!adsActive()) return null;
  const src = `https://cdn.carbonads.com/carbon.js?serve=${encodeURIComponent(site.ads.serve)}&placement=${encodeURIComponent(site.ads.placement)}`;
  return (
    <aside className="ad-slot" aria-label="Advertisement">
      <Script id="carbon-ads" src={src} strategy="afterInteractive" />
    </aside>
  );
}
