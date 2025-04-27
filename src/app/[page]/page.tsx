import Prose from "@/components/prose";
import { getPage } from "@/lib/shopify";
import { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * This file implements a dynamic route for CMS-driven pages (e.g., /about, /faq).
 * 
 * Why dynamic? Instead of hardcoding every possible page, we let the CMS (Shopify in this case)
 * define what pages exist. This makes the site more maintainable for non-developers and
 * allows marketing/legal to add or update content without code changes.
 * 
 * The pattern here is: 
 * - Use the dynamic segment ([page]) to match any slug.
 * - Fetch the page data from Shopify using that slug.
 * - If the page doesn't exist, show a 404.
 * - If it does, render the content and set up SEO metadata.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  // Next.js may pass params as a Promise in some environments, so we always await it.
  const resolvedParams = await Promise.resolve(params);
  // Fetch the page data for the given slug.
  const page = await getPage(resolvedParams.page);

  if (!page) return notFound();

  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.bodySummary,
    openGraph: {
      publishedTime: page.createdAt,
      modifiedTime: page.updatedAt,
      type: "article",
    },
  };
}

export default async function Page({
  params,
}: {
  params:  Promise<{ page: string }>;
}) {
  // Always await params for compatibility with Next.js's dynamic routing.
  const resolvedParams = await Promise.resolve(params);
  const page = await getPage(resolvedParams.page);

  if (!page) return notFound();

  return (
    <>
      <h1 className="mb-8 text-5xl font-bold">{page.title}</h1>
      <Prose className="mb-8" html={page.body as string} />
      <p className="text-sm italic">
        {`This document was last updated on ${new Intl.DateTimeFormat(
          undefined,
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        ).format(new Date(page.updatedAt))}.`}
      </p>
    </>
  );
}