
import Grid from "@/components/grid";
import ProductGridItems from "@/components/layout/product-grid-items";
import SuspenseFallback from "@/components/suspenseFallback";
import { defaultSort, sorting } from "@/lib/constants";
import { getProducts } from "@/lib/shopify";
import React, { Suspense } from "react";

export const metadata = {
  title: "Search",
  description: "Search for products in the store.",
};

type SearchPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function SearchResults({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { sort, s: searchValue } = params;
  const searchQuery = Array.isArray(searchValue) ? searchValue[0] : searchValue;
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;
  const products = await getProducts({ sortKey, reverse, query: searchQuery });
  const resultsText = products.length > 1 ? "results" : "result";

  return (
    <>
      {searchQuery ? (
        <p className="mb-4">
          {products.length === 0
            ? "There are no products that match"
            : `Showing ${products.length} ${resultsText} for `}
          <span>&quot;{searchQuery}&quot;</span>
        </p>
      ) : null}
      {products.length > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      ) : null}
    </>
  );
}

export default function SearchPage(props: SearchPageProps) {
  return (
    <Suspense fallback={<SuspenseFallback/>}>
      <SearchResults {...props} />
    </Suspense>
  );
}
