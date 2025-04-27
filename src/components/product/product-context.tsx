"use client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useContext, createContext, useOptimistic, useMemo } from "react";

/**
 * Product context and provider for managing product option state (e.g., selected variant, image).
 *
 * Why: Product pages often have multiple options (size, color, etc.) and images. We need a way to
 * share the selected state between components (gallery, variant selector, add to cart) without prop drilling.
 *
 * This context is also responsible for syncing state with the URL, so users can share links to specific variants/images.
 */
type productState = {
  [key: string]: string;
} & {
  image?: string;
};
type ProductContextType = {
  state: productState;
  updateOption: (name: string, value: string) => productState;
  updateImage: (index: string) => productState;
};
const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  // Read initial state from URL search params (so links/bookmarks work)
  const searchParams = useSearchParams();
  const getInitialState = () => {
    const params : productState = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  };
  
  const [state, setOptimisticState] = useOptimistic(
    getInitialState(),
    (prevState: productState, update: productState) => ({
      ...prevState,
      ...update,
    })
  );

  const updateOption = (name: string, value: string) => {
    const newState = { ...state, [name]: value };
    setOptimisticState(newState);
    return newState;
  };

  const updateImage = (index: string) => {
    const newState = { ...state, image: index };
    setOptimisticState(newState);
    return newState;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({state, updateOption, updateImage}), [state])
  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

/**
 * Custom hook to access the product context.
 * Throws an error if used outside a ProductProvider.
 */
export function useProduct() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProduct must be used within a ProductProvider");
  }
  return context;
}

/**
 * Custom hook to update the URL with the current product state (variant, image, etc.).
 */
export function useUpdateURL() {
  const router = useRouter();
  return (state: productState) => {
    const newParams = new URLSearchParams(window.location.search);

    Object.entries(state).forEach(([key, value]) => {
      if (value !== undefined) {
        newParams.set(key, value);
      }
    });
    router.push(`?${newParams.toString()}`, { scroll: false });
  };
}
