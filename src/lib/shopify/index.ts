import { env } from "@/env";
import {
  HIDDEN_PRODUCT_TAG,
  SHOPIFY_GRAPHQL_API_ENDPOINT,
  TAGS,
} from "../constants";
import { getMenuQuery } from "./queries/menu";
import {
  Collection,
  Connection,
  Image,
  Menu,
  Product,
  ShopifyCollection,
  ShopifyCollectionProductsOperation,
  ShopifyCollectionsOperation,
  ShopifyMenuOperation,
  ShopifyProduct,
  ShopifyProductsOperation,
  ShopifyProductOperation,
  ShopifyAddToCartOperation,
  ShopifyCart,
  Cart,
  ShopifyProductRecommendationsOperation,
  ShopifyCartOperation,
  ShopifyCreateCartOperation,
  ShopifyRemoveFromCartOperation,
  ShopifyUpdateCartOperation,
  Page,
  ShopifyPagesOperation,
  ShopifyPageOperation,
} from "./types";
import { ensureStartsWith } from "../utils";
import { isShopifyError } from "../type-guards";
import {
  getProductQuery,
  getProductRecommendationsQuery,
  getProductsQuery,
} from "./queries/product";
import {
  getCollectionProductsQuery,
  getCollectionsQuery,
} from "./queries/collection";
import {
  addToCartMutation,
  createCartMutation,
  editCartItemsMutation,
  removeFromCartMutation,
} from "./mutations/cart";
import { getCartQuery } from "./queries/cart";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPageQuery, getPagesQuery } from "./queries/page";

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
      console.error("Missing Shopify credentials:", {
        domain: !!domain,
        key: !!key,
      });
      throw new Error("Missing Shopify credentials");
    }

    // All requests are POSTs to the GraphQL endpoint
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
      ...(tags && { next: { tags } }), // Next.js tag-based revalidation
    });
    if (!result.ok) {
      throw new Error(`HTTP error! status: ${result.status}`);
    }

    const body = await result.json();
    if (body.errors) {
      console.error("Shopify API Error:", body.errors);
      throw body.errors[0];
    }

    return {
      status: result.status,
      body,
    };
  } catch (error) {
    if (isShopifyError(error)) {
      console.error("Shopify Error:", {
        cause: error.cause?.toString(),
        status: error.status,
        message: error.message,
        query,
      });
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

// --- Data Reshaping Utilities ---
// Shopify's GraphQL API returns deeply nested data (edges/nodes). These helpers flatten and adapt it for our app.
function removeEdgesAndNodes<T>(array: Connection<T>): T[] {
  return array.edges.map((edge) => edge?.node);
}
function reshapImages(images: Connection<Image>, productTitle: string) {
  const flatend = removeEdgesAndNodes(images);
  return flatend.map((image) => {
    const fileName = image.url.match(/.*\/(.*)\..*/)?.[1];
    return {
      ...image,
      altText: image.altText || `${productTitle} - ${fileName}`,
    };
  });
}
function reshapeProduct(
  product: ShopifyProduct,
  filterHiddenProducts: boolean = true
) {
  // Hide products with the special hidden tag unless explicitly requested
  if (
    !product ||
    (filterHiddenProducts && product.tags.includes(HIDDEN_PRODUCT_TAG))
  ) {
    return undefined;
  }
  const { images, variants, ...rest } = product;
  return {
    ...rest,
    images: reshapImages(images, product.title),
    variants: removeEdgesAndNodes(variants),
  };
}
function reshapeProducts(products: ShopifyProduct[]) {
  const reshapedProducts = [];
  for (const product of products) {
    if (product) {
      const reshapedProduct = reshapeProduct(product);
      if (reshapedProduct) {
        reshapedProducts.push(reshapedProduct);
      }
    }
  }
  return reshapedProducts;
}
export async function getProducts({
  query,
  reverse,
  sortKey,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  const res = await shopifyFetch<ShopifyProductsOperation>({
    query: getProductsQuery,
    tags: [TAGS.products],
    variables: {
      query,
      reverse,
      sortKey,
    },
  });
  return reshapeProducts(removeEdgesAndNodes(res.body.data.products));
}

function reshapeCollection(
  collection: ShopifyCollection
): Collection | undefined {
  if (!collection) return undefined;
  return {
    ...collection,
    path: `/search/${collection.handle}`,
  };
}
function reshapeCollections(collections: ShopifyCollection[]) {
  const reshapedCollections = [];
  for (const collection of collections) {
    if (collection) {
      const reshapedCollectoin = reshapeCollection(collection);
      if (reshapedCollectoin) {
        reshapedCollections.push(reshapedCollectoin);
      }
    }
  }
  return reshapedCollections;
}
export async function getCollections(): Promise<Collection[]> {
  const res = await shopifyFetch<ShopifyCollectionsOperation>({
    query: getCollectionsQuery,
    tags: [TAGS.collections],
  });

  const shopifyCollections = removeEdgesAndNodes(res?.body?.data?.collections);
  // Add a default "All" collection for UX
  const collections = [
    {
      handle: "",
      title: "All",
      description: "All products",
      seo: {
        title: "All",
        description: "All products",
      },
      path: "/search",
      updatedAt: new Date().toISOString(),
    },
    // Filter out the hidden products
    ...reshapeCollections(shopifyCollections).filter(
      (collection) => !collection.handle.startsWith("hidden")
    ),
  ];

  return collections;
}
export async function getCollectionProducts({
  collection,
  reverse,
  sortKey,
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  const res = await shopifyFetch<ShopifyCollectionProductsOperation>({
    query: getCollectionProductsQuery,
    tags: [TAGS.collections, TAGS.products],
    variables: {
      handle: collection,
      reverse,
      sortKey: sortKey === "CREATED_AT" ? "CREATED" : sortKey,
    },
  });

  if (!res.body.data.collection) {
    console.log(`No collection found for \`${collection}\``);
    return [];
  }

  return reshapeProducts(
    removeEdgesAndNodes(res.body.data.collection.products)
  );
}
export async function getProduct(handle: string) {
  const res = await shopifyFetch<ShopifyProductOperation>({
    query: getProductQuery,
    tags: [TAGS.products],
    variables: {
      handle,
    },
  });
  return reshapeProduct(res.body.data.product, false);
}
function reshapeCart(cart: ShopifyCart): Cart {
  // Shopify sometimes returns null for totalTaxAmount; default to 0 for safety
  if (!cart.cost?.totalAmount) {
    cart.cost.totalTaxAmount = { amount: "0.0", currencyCode: "USD" };
  }
  return { ...cart, lines: removeEdgesAndNodes(cart.lines) };
}
export async function createCart(): Promise<Cart> {
  const res = await shopifyFetch<ShopifyCreateCartOperation>({
    query: createCartMutation,
    cache: "no-store",
  });

  return reshapeCart(res.body.data.cartCreate.cart);
}
export async function removeFromCart(
  cartId: string,
  lineIds: string[]
): Promise<Cart> {
  const res = await shopifyFetch<ShopifyRemoveFromCartOperation>({
    query: removeFromCartMutation,
    variables: {
      cartId,
      lineIds,
    },
    cache: "no-store",
  });
  return reshapeCart(res.body.data.cartLinesRemove.cart);
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const res = await shopifyFetch<ShopifyAddToCartOperation>({
    query: addToCartMutation,
    variables: {
      cartId,
      lines,
    },
    cache: "no-cache",
  });

  return reshapeCart(res.body.data.cartLinesAdd.cart);
}
export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  const res = await shopifyFetch<ShopifyProductRecommendationsOperation>({
    query: getProductRecommendationsQuery,
    tags: [TAGS.products],
    variables: {
      productId,
    },
  });
  return reshapeProducts(res.body.data.productRecommendations);
}

/**
 *  Used to restore a user's cart from a session or cookie.
 */
export async function getCart(
  cartId: string | undefined
): Promise<Cart | undefined> {
  if (!cartId) {
    return undefined;
  }
  const res = await shopifyFetch<ShopifyCartOperation>({
    query: getCartQuery,
    variables: { cartId },
    tags: [TAGS.cart],
  });
  // all costs become null when you checkout
  if (!res.body.data.cart) return undefined;

  return reshapeCart(res.body.data.cart);
}
export async function updateCart(
  cartId: string,
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const res = await shopifyFetch<ShopifyUpdateCartOperation>({
    query: editCartItemsMutation,
    variables: {
      cartId,
      lines,
    },
    cache: "no-store",
  });

  return reshapeCart(res.body.data.cartLinesUpdate.cart);
}

/**
 * Handles on-demand revalidation (Incremental Static Regeneration, ISR) from Shopify webhooks.
 *
 *When content or products are updated in Shopify, we want our Next.js static pages
 * (e.g., product or collection pages) to update immediately.
 * Shopify can send webhooks to this endpoint whenever a relevant resource changes.
 *
 * How it works:
 * 1. Shopify sends a webhook to this endpoint when a product or collection is created, updated, or deleted.
 * 2. The function checks the webhook topic (e.g., 'products/update') and a secret for security.
 * 3. If the topic is relevant and the secret is valid, it calls Next.js's revalidateTag to invalidate the cache for affected pages.
 * 4. Always returns a 200 response to Shopify, even if the secret is invalid, to prevent repeated retries.
 * 
 * Next.js's revalidateTag is used to invalidate all pages tagged with the relevant resource (products or collections),
 * so the next request will fetch fresh data from Shopify.

 */
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  const collectionWebhooks = [
    "collections/create",
    "collections/delete",
    "collections/update",
  ];
  const productWebhooks = [
    "products/create",
    "products/delete",
    "products/update",
  ];
  const topic = (await headers()).get("x-shopify-topic") || "unknown";
  const secret = req.nextUrl.searchParams.get("secret");
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);
  if (!secret || secret !== env.SHOPIFY_REVALIDATION_SECRET) {
    console.error("Invalid revalidation secret.");
    return NextResponse.json({ status: 200 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections);
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products);
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}

/**
  Used for dynamic content pages (e.g., /about, /faq).
 */
export async function getPage(handle: string): Promise<Page> {
  const res = await shopifyFetch<ShopifyPageOperation>({
    query: getPageQuery,
    cache: "no-store",
    variables: { handle },
  });

  return res.body.data.pageByHandle;
}

/**
 sed for navigation, sitemaps, and search.
 */
export async function getPages(): Promise<Page[]> {
  const res = await shopifyFetch<ShopifyPagesOperation>({
    query: getPagesQuery,
    cache: "no-store",
  });

  return removeEdgesAndNodes(res.body.data.pages);
}
