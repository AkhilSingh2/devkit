import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { pages } from "../lib/registry";

const root = process.cwd();
const font = "Inter, Noto Sans, sans-serif";

async function main() {
type Card = { file: string; title: string; description: string };

const cards: Card[] = [
  { file: "home.png", title: "DevKit", description: "Private developer tools that run in your browser." },
  ...pages.map((page) => ({
    file: `${page.slug.replaceAll("/", "-")}.png`,
    title: page.h1,
    description: page.description,
  })),
];

  await mkdir(path.join(root, "public/og"), { recursive: true });
  await mkdir(path.join(root, "public/icons"), { recursive: true });

  for (const card of cards) {
    const png = await sharp(Buffer.from(cardSvg(card.title, card.description))).png().toBuffer();
    await sharp(png).toFile(path.join(root, "public/og", card.file));
  }

  await sharp(Buffer.from(iconSvg(false))).png().resize(192, 192).toFile(path.join(root, "public/icons/icon-192.png"));
  await sharp(Buffer.from(iconSvg(false))).png().resize(512, 512).toFile(path.join(root, "public/icons/icon-512.png"));
  await sharp(Buffer.from(iconSvg(false))).png().resize(180, 180).toFile(path.join(root, "public/icons/apple-touch-icon.png"));
  await sharp(Buffer.from(iconSvg(true))).png().resize(512, 512).toFile(path.join(root, "public/icons/maskable-512.png"));

  console.log(`wrote ${cards.length} social images`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

function cardSvg(title: string, description: string): string {
  const lines = wrap(title, 22).slice(0, 3);
  const titleSvg = lines
    .map((line, index) => `<text x="88" y="${250 + index * 78}" fill="#e7f2ec" font-family="${font}" font-size="64" font-weight="700">${escapeXml(line)}</text>`)
    .join("");
  const descY = 250 + lines.length * 78 + 36;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#101614"/>
  <rect width="18" height="630" fill="#8ee4b8"/>
  <text x="88" y="120" fill="#8ee4b8" font-family="${font}" font-size="28" letter-spacing="4">DEVKIT</text>
  ${titleSvg}
  <text x="88" y="${Math.min(descY, 540)}" fill="#c5ddd0" font-family="${font}" font-size="28">${escapeXml(description.slice(0, 90))}</text>
</svg>`;
}

function iconSvg(maskable: boolean): string {
  const inset = maskable ? 96 : 48;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="${maskable ? 0 : 96}" fill="#101614"/>
  <rect x="${inset}" y="78" width="56" height="356" rx="8" fill="#8ee4b8"/>
  <text x="${inset + 84}" y="340" fill="#e7f2ec" font-family="${font}" font-size="240" font-weight="700">D</text>
</svg>`;
}

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
