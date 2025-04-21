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
  ShopifyCollectionsOperation,
  ShopifyMenuOperation,
  ShopifyProduct,
  ShopifyProductsOperation,
} from "./types";
import { ensureStartsWith } from "../utils";
import { isShopifyError } from "../type-guards";
import { getProductQuery } from "./queries/product";
import { getCollectionsQuery } from "./queries/collection";

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
      console.log(error);
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
    query: getProductQuery,
    tags: [TAGS.products],
    variables: {
      query,
      reverse,
      sortKey,
    },
  });
  return reshapeProducts(removeEdgesAndNodes(res.body.data.products));
}

function reshapeCollection(collection: ShopifyCollection): Collection | undefined {
  if (!collection) return undefined;
  return {
    ...collection,
    path: `/search/${collection.handle}`
  }
}
function reshapeCollections(collections:ShopifyCollection[]) {
  const reshapedCollections = [];
  for (const collection of collections) {
    if (collection) {
      const reshapedCollectoin = reshapeCollection(collection);
      if (reshapedCollectoin) {
        reshapedCollections.push(reshapedCollectoin)
      }
    }
  }
  return reshapedCollections;
}
export async function getCollections(): Promise<Collection[]> {
  const res = await shopifyFetch<ShopifyCollectionsOperation>({
    query: getCollectionsQuery,
    tags: [TAGS.collections]
  })
  
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