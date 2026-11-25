export function sitePath(slug = ""): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!slug) return `${base}/`;
  return `${base}/${slug}/`;
}
