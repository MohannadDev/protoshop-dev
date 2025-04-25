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
} from "./types";
import { ensureStartsWith } from "../utils";
import { isShopifyError } from "../type-guards";
import { getProductQuery, getProductRecommendationsQuery, getProductsQuery } from "./queries/product";
import {
  getCollectionProductsQuery,
  getCollectionsQuery,
} from "./queries/collection";
import { addToCartMutation, createCartMutation, editCartItemsMutation, removeFromCartMutation } from "./mutations/cart";
import { getCartQuery } from "./queries/cart";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

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
      console.error('Missing Shopify credentials:', { domain: !!domain, key: !!key });
      throw new Error("Missing Shopify credentials");
    }

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
    // console.log("shopify fetch response status:", result.status);
    // console.log(headers, tags, query, variables);
    if (!result.ok) {
      throw new Error(`HTTP error! status: ${result.status}`);
    }

    const body = await result.json();
    if (body.errors) {
      console.error('Shopify API Error:', body.errors);
      throw body.errors[0];
    }

    return {
      status: result.status,
      body,
    };
  } catch (error) {
    if (isShopifyError(error)) {
      console.error('Shopify Error:', {
        cause: error.cause?.toString(),
        status: error.status,
        message: error.message,
        query
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
  // console.log(res);
  return reshapeProduct(res.body.data.product, false);
}
function reshapeCart(cart: ShopifyCart): Cart {
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
export async function removeFromCart(cartId: string, lineIds: string[]) : Promise<Cart> {
  const res = await shopifyFetch<ShopifyRemoveFromCartOperation>({
    query: removeFromCartMutation,
    variables: {
      cartId,
      lineIds
    },
    cache: "no-store"
  })
  return reshapeCart(res.body.data.cartLinesRemove.cart)
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number}[]
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
export async function getProductRecommendations(productId: string): Promise<Product[] >{
  const res = await shopifyFetch<ShopifyProductRecommendationsOperation>({
    query: getProductRecommendationsQuery,
    tags: [TAGS.products],
    variables: {
      productId,
    },
  });
  // console.log(res);
  return reshapeProducts(res.body.data.productRecommendations);
}
export async function getCart(cartId: string | undefined): Promise<Cart | undefined> {
  if (!cartId) {
    return undefined
  }
  const res = await shopifyFetch<ShopifyCartOperation>({
    query: getCartQuery,
    variables: {cartId},
    tags: [TAGS.cart]
  })
  // all costs become null when you checkout
  if(!res.body.data.cart) return undefined;

  return reshapeCart(res.body.data.cart)
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

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Shopify,
  // otherwise it will continue to retry the request.

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
    // We don't need to revalidate anything for any other topics.
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

// export async function getPage(handle: string): Promise<Page> {
//   const res = await shopifyFetch<ShopifyPageOperation>({
//     query: getPageQuery,
//     cache: "no-store",
//     variables: { handle },
//   });

//   return res.body.data.pageByHandle;
// }

// export async function getPages(): Promise<Page[]> {
//   const res = await shopifyFetch<ShopifyPagesOperation>({
//     query: getPagesQuery,
//     cache: "no-store",
//   });

//   return removeEdgesAndNodes(res.body.data.pages);
// }