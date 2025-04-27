import { revalidate } from "@/lib/shopify";
import { NextRequest, NextResponse } from "next/server";

/**
 * API route for on-demand revalidation (ISR) from Shopify webhooks.
 * 
 * Why? When content or products are updated in Shopify, we want to update our Next.js
 * static pages immediately, not just on a schedule. This endpoint is called by Shopify
 * webhooks to trigger a revalidation of the affected page(s).
 * 
 * The POST handler simply delegates to the revalidate utility, which handles
 * authentication, payload parsing, and cache invalidation.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Delegate to the revalidate utility, which handles all the logic.
  return revalidate(req);
}