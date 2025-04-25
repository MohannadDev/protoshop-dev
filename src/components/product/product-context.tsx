"use client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useContext, createContext, useOptimistic, useMemo } from "react";
// import {  } from "vm";

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

export function useProduct() {
  const context = useContext(ProductContext);
  // console.log("context");
  // console.log(context);
  if (context === undefined) {
    throw new Error("useProduct must be used within a ProductProvider");
  }
  return context;
}
export function useUpdateURL() {
  const router = useRouter();
  return (state: productState) => {
    const newParams = new URLSearchParams(window.location.search);
    // console.log(window.location.search, newParams);

    Object.entries(state).forEach(([key, value]) => {
      if (value !== undefined) {
        newParams.set(key, value);
      }
    });
    // router.push(`${newParams.toString()}`, {scroll: false, shallow: true,})
    router.push(`?${newParams.toString()}`, { scroll: false });
  };
}
