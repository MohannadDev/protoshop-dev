import { Product } from "@/lib/shopify/types";
import Price from "../price";
import VariantSelector from "./variant-selector";
import { AddToCart } from "../cart/add-to-cart";
import Prose from "../prose";

export function ProductDescription({ product }: { product: Product }) {
  return (
    <>
      <div className="flex flex-col pb-6 mb-6 border-b dark:border-neutral-700">
        <h1 className="mb-2 text-5xl font-medium">{product.title}</h1>
        <div className="w-auto p-2 mr-auto text-sm text-white bg-blue-600 rounded-full">
          <Price
            // TODO: edit the price component so if there was a range display it
            amount={product.priceRange.maxVariantPrice.amount}
            currencyCode={product.priceRange.maxVariantPrice.currencyCode}
          />
        </div>
      </div>
      <VariantSelector options={product.options} variants={product.variants} />
      {/* Product description as rich HTML, if available */}
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-light dark:text-white/[60%]"
          html={product.descriptionHtml}
        />
      ) : null}
  
      <AddToCart product={product} />
    </>
  );
}