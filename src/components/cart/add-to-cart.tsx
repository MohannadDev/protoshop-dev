"use client";

import { useProduct } from "@/components/product/product-context";
import { Product, ProductVariant } from "@/lib/shopify/types";
import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCart } from "./cart-context";
import { useActionState } from "react";
import { addItem } from "./actions";


function SubmitButton({
  availableForSale,
  selectedVariantID,
}: {
  availableForSale: boolean;
  selectedVariantID: string | undefined;
}) {
  const buttonClasses =
    "relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white";
  const disabledClasses = "cursor-not-allowed opacity-60 hover:opacity-60";
  
  if (!availableForSale) {
    return (
      <button disabled className={clsx(buttonClasses, disabledClasses)}>
        Out of Stock
      </button>
    );
  }
  
  if (!selectedVariantID) {
    return (
      <button
        aria-label="Please select an option"
        disabled
        className={clsx(buttonClasses, disabledClasses)}
      >
        Add to Cart
      </button>
    );
  }

  return (
    <button
      type="submit"
      aria-label="Add to Cart"
      className={clsx(buttonClasses, {
        "hover:opacity-90": true,
      })}
    >
      <div className="absolute left-0 ml-4">
        <PlusIcon className="h-5" />
      </div>
      Add to Cart
    </button>
  );
}

export function AddToCart({ product }: { product: Product }) {
  const { variants } = product;
  const { state } = useProduct();
  const { addCartItem } = useCart();
  const [message, formAction] = useActionState(addItem, null);

  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === state[option.name.toLowerCase()]
    )
  );

  const defaultVariantID = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantID = variant?.id || defaultVariantID;
  const finalVariant = variants.find(
    (variant) => variant.id === selectedVariantID
  );

  const actionWithVariant = formAction.bind(null, selectedVariantID);

  return (
    <form
      action={async () => {
        if (!finalVariant) {
          console.error("No variant selected");
          return;
        }
        
        try {
          await actionWithVariant();
          addCartItem(finalVariant, product);
        } catch (error) {
          console.error("Error adding item to cart:", error);
        }
      }}
    >
      <SubmitButton 
        availableForSale={finalVariant?.availableForSale ?? false} 
        selectedVariantID={selectedVariantID} 
      />
      <p aria-live="polite" role="status" className="sr-only">
        {message}
      </p>
    </form>
  );
}