/**
 * Dynamic OpenGraph image for CMS-driven pages.
 *
 * Why: By generating a unique OG image for each CMS page, we improve social sharing
 * and SEO. This ensures that when a user shares a page (e.g., /about), the preview
 * is relevant and branded.
 *
 * The image is generated at the edge for low latency.
 */
import OpengraphImage from "@/components/opengraph-image";
import { getPage } from "@/lib/shopify";

export const runtime = "edge";

export default async function Image({ params }: { params: { page: string } }) {
  const page = await getPage(params.page);
  const title = page.seo?.title || page.title;

  // Pass the page title to the OG image component for dynamic rendering
  return await OpengraphImage({ title });
}