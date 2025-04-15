import { env } from "@/env";
import { SHOPIFY_GRAPHQL_API_ENDPOINT, TAGS } from "../constants";
import { getMenuQuery } from "./queries/menu";
import { Menu, ShopifyMenuOperation } from "./types";
import { ensureStartsWith } from "../utils";
import { isShopifyError } from "../type-guards";

const domain = env.SHOPIFY_STORE_DOMAIN
  ? ensureStartsWith(env.SHOPIFY_STORE_DOMAIN, "https://")
  : "";
type ExtractVariables<T> = T extends { variables: object }
  ? T["variables"]
  : never;
  const endpoint = `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}`;
  const key = env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
type ShopifyFetchParams<T> = {
    cache?: RequestCache;
    headers?: HeadersInit;
    query: string;
    tags?: string[];
    variables?: ExtractVariables<T>;
  };
export async function shopifyFetch<T>({
  cache = "force-cache",
  headers,
  query,
  tags,
  variables,
}: ShopifyFetchParams<T>): Promise<{ status: number; body: T } | never> {
  try {
    if (!domain || !key) {
      throw new Error("Missing Shopify credentials");
    }
    
    console.log('Debug Info:');
    console.log('Domain:', domain);
    console.log('Endpoint:', endpoint);
    console.log('Access Token:', key.substring(0, 5) + '...');
    
    const result = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": key,
        ...headers,
      },
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables }),
      }),
      cache,
      ...(tags && { next: { tags } }),
    });

    if (!result.ok) {
      console.log('Response Status:', result.status);
      console.log('Response Status Text:', result.statusText);
      console.log('Response Headers:', Object.fromEntries(result.headers.entries()));
      const errorText = await result.text();
      console.log('Error Response:', errorText);

      throw new Error(`HTTP error! status: ${result.status}`);
    }

    const body = await result.json();
    if (body.errors) {
      throw body.errors[0];
    }
    
    return {
      status: result.status,
      body,
    };

  } catch (error) {
    if (isShopifyError(error)) {
        console.log(error)
      throw {
        cause: error.cause?.toString() || "unknown",
        status: error.status || 500,
        message: error.message,
        query,
      };
    }
    throw {
      cause: "unknown",
      status: 500,
      message: error instanceof Error ? error.message : "Unexpected error",
      query,
    };
  }
}
export async function getMenu(handle: string): Promise<Menu[]> {
  // const menu = await fetch(`${process.env.SHOPIFY_STORE_URL}/api/2024-04/menus/${handle}.json`);
  // return menu.json();
  const res = await shopifyFetch<ShopifyMenuOperation>({
    query: getMenuQuery,
    tags: [TAGS.collections],
    variables: {
      handle,
    },
  });
  return (
    res.body?.data.menu?.items.map((item: { title: string; url: string }) => ({
      title: item.title,
      path: item.url
        .replace(domain, "")
        .replace("/collections", "/search")
        .replace("/pages", ""),
    })) || []
  );
}
