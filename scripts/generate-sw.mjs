import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("out");
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const files = await walk(outDir);
const urls = new Set();

for (const file of files) {
  const rel = path.relative(outDir, file).split(path.sep).join("/");
  if (rel === "sw.js" || rel.endsWith(".map")) continue;
  urls.add(`${base}/${rel}`.replaceAll("//", "/"));
  if (rel.endsWith("index.html")) {
    const pretty = rel.slice(0, -"index.html".length);
    urls.add(`${base}/${pretty}`.replaceAll("//", "/") || `${base}/`);
  }
}

const list = [...urls].sort();
const version = createHash("sha256").update(list.join("\n")).digest("hex").slice(0, 12);
const source = `const CACHE = "devkit-${version}";
const URLS = ${JSON.stringify(list)};
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(URLS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (url.pathname.includes("/_next/static/")) {
      const hit = await cache.match(event.request);
      if (hit) return hit;
    }
    try {
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      return (await cache.match(event.request)) || (await cache.match(${JSON.stringify(`${base}/offline.html`)})) || Response.error();
    }
  })());
});
`;

await writeFile(path.join(outDir, "sw.js"), source);
console.log(`service worker precaches ${list.length} urls (${version})`);

async function walk(dir) {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

void readFile;
