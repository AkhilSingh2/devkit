function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function originFromEnv(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export const site = {
  name: "DevKit",
  title: "DevKit — Private developer tools in your browser",
  description:
    "Format JSON, convert YAML, decode JWTs, test regex, and run twenty more developer tools locally. Nothing you paste is uploaded.",
  url: originFromEnv(),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  locale: "en_US",
  themeColor: "#101614",
  ads: {
    enabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",
    serve: process.env.NEXT_PUBLIC_CARBON_SERVE || "",
    placement: process.env.NEXT_PUBLIC_CARBON_PLACEMENT || "",
  },
  analytics: {
    plausible: process.env.NEXT_PUBLIC_PLAUSIBLE === "true",
    domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "",
    src: process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js",
  },
  sponsorUrl: process.env.NEXT_PUBLIC_SPONSOR_URL || "",
};

export function absoluteUrl(path: string): string {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  const withSlash = normalised.endsWith("/") ? normalised : `${normalised}/`;
  return `${site.url}${site.basePath}${withSlash === "//" ? "/" : withSlash}`;
}

export function adsActive(): boolean {
  return site.ads.enabled && Boolean(site.ads.serve && site.ads.placement);
}

export function analyticsActive(): boolean {
  return site.analytics.plausible && Boolean(site.analytics.domain);
}
