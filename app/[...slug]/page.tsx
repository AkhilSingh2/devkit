import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolScreen } from "@/components/tool-screen";
import { getPage, ogName, pages } from "@/lib/registry";

type Params = { slug: string[] };

export function generateStaticParams() {
  return pages.map((page) => ({ slug: page.slug.split("/") }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug.join("/"));
  if (!page) return {};
  const path = `/${page.slug}/`;
  const image = `/og/${ogName(page.slug)}`;
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: path },
    openGraph: {
      title: page.title,
      description: page.description,
      url: path,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: page.h1 }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [image],
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = getPage(slug.join("/"));
  if (!page) notFound();
  return <ToolScreen page={page} />;
}
