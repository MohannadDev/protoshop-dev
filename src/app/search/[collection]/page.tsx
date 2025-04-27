import Grid from "@/components/grid";
import ProductGridItems from "@/components/layout/product-grid-items";
import { defaultSort, sorting } from "@/lib/constants";
import { getCollectionProducts } from "@/lib/shopify";

/**
 * Collection search page.
 *
 * This dynamic route renders products for a given collection.
 *
 * The reasoning for using dynamic routes is to keep URLs clean
 * and RESTful, e.g. `/search/shoes` instead of `/search?collection=shoes`.
 */
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Extract sort options from the query string, defaulting to our preferred sort.
  const { sort } = (await searchParams) as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const products = await getCollectionProducts({
    collection: (await params).collection,
    sortKey,
    reverse,
  });
  console.log(products)
  return (
    <section>
      {products.length === 0 ? (
        <p className="py-3 text-lg">{`No products found in this collection`}</p>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      )}
    </section>
  );
}
