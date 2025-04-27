"use client";
import { Cart, CartItem, Product, ProductVariant } from "@/lib/shopify/types";
import { useContext, createContext, use, useOptimistic } from "react";

/**
 * Cart context and provider for managing cart state and actions across the app.
 *
 * Why: The cart is a global feature in e-commerce. This context allows any component
 * to read or update the cart without prop drilling, and provides optimistic UI updates for better UX.
 *
 * The context exposes methods to add, update, and remove items, and keeps the cart in sync with the server.
 */
type UpdateType = "plus" | "minus" | "delete";

type CartContextType = {
  cart: Cart | undefined;
  updateCartItem: (merchandiseId: string, updateType: UpdateType) => void;
  addCartItem: (variant: ProductVariant, product: Product) => void;
};
type cartAction =
  | {
      type: "UPDATE_ITEM";
      payload: { merchendiseID: string; updateType: UpdateType };
    }
  | {
      type: "ADD_ITEM";
      payload: { variant: ProductVariant; product: Product };
    };

const cartContext = createContext<CartContextType | undefined>(undefined);

// Returns a new, empty cart object
function createEmptyCart(): Cart {
  return {
    id: undefined,
    checkoutUrl: "",
    totalQuantity: 0,
    lines: [],
    cost: {
      subtotalAmount: { amount: "0", currencyCode: "USD" },
      totalAmount: { amount: "0", currencyCode: "USD" },
      totalTaxAmount: { amount: "0", currencyCode: "USD" },
    },
  };
}

// Calculates total quantity and cost for the cart
function updateCartTotals(
  lines: CartItem[]
): Pick<Cart, "totalQuantity" | "cost"> {
  const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = lines.reduce(
    (sum, item) => sum + Number(item.cost.totalAmount.amount),
    0
  );
  const currencyCode = lines[0]?.cost.totalAmount.currencyCode ?? "USD";
  return {
    totalQuantity,
    cost: {
      subtotalAmount: { amount: totalAmount.toString(), currencyCode },
      totalAmount: { amount: totalAmount.toString(), currencyCode },
      totalTaxAmount: { amount: "0", currencyCode },
    },
  };
}

// Calculates the total cost for a given quantity and price
function calculateItemCost(quantity: number, price: string): string {
  return (Number(price) * quantity).toString();
}

// Updates a cart item based on the action (plus, minus, delete)
function updateCartItem(
  item: CartItem,
  updateType: UpdateType
): CartItem | null {
  if (updateType === "delete") return null;
  const newQuantity = updateType === "plus" ? item.quantity + 1 : item.quantity - 1;
  if (newQuantity === 0) return null;
  const singleItemAmount = Number(item.cost.totalAmount.amount) / item.quantity;
  const newTotalAmount = calculateItemCost(
    newQuantity,
    singleItemAmount.toString()
  );

  return {
    ...item,
    quantity: newQuantity,
    cost: {
      ...item.cost,
      totalAmount: { ...item.cost.totalAmount, amount: newTotalAmount },
    },
  };
}

// Creates a new cart item or updates an existing one
function createOrUpdateCartItem(
  existingItem: CartItem | undefined,
  variant: ProductVariant,
  product: Product
): CartItem {
  const quantity = existingItem ? existingItem.quantity + 1 : 1;
  const totalAmount = calculateItemCost(quantity, variant.price.amount);
  return {
    id: existingItem?.id,
    quantity,
    cost: {
      totalAmount: {
        amount: totalAmount,
        currencyCode: variant.price.currencyCode,
      },
    },
    merchandise: {
      id: variant.id,
      title: variant.title,
      selectedOptions: variant.selectedOptions,
      product: {
        id: product.id,
        handle: product.handle,
        title: product.title,
        featuredImage: product.featuredImage,
      },
    },
  };
}

// Reducer to handle cart actions (add, update, remove)
function cartReducer(state: Cart | undefined, action: cartAction): Cart {
  const currentCart = state || createEmptyCart();
  switch (action.type) {
    case "UPDATE_ITEM": {
      const { merchendiseID, updateType } = action.payload;
      const updatedLines = currentCart.lines
        .map((item) => {
          return item.merchandise.id === merchendiseID
            ? updateCartItem(item, updateType)
            : item;
        })
        .filter(Boolean) as CartItem[];
      if (updatedLines.length === 0) {
        return {
          ...currentCart,
          lines: [],
          totalQuantity: 0,
          cost: {
            ...currentCart.cost,
            totalAmount: { ...currentCart.cost.totalAmount, amount: "0" },
          },
        };
      }
      return {
        ...currentCart,
        ...updateCartTotals(updatedLines),
        lines: updatedLines,
      };
    }
    case "ADD_ITEM": {
      const { variant, product } = action.payload;
      const existingItem = currentCart.lines.find(
        (item) => item.merchandise.id === variant.id
      );
      const updatedItem = createOrUpdateCartItem(
        existingItem,
        variant,
        product
      );
      const updatedLines = existingItem
        ? currentCart.lines.map((item) =>
            item.merchandise.id === variant.id ? updatedItem : item
          )
        : [...currentCart.lines, updatedItem];
      return {
        ...currentCart,
        ...updateCartTotals(updatedLines),
        lines: updatedLines,
      };
    }
    default: return currentCart;
  }
}

/**
 * CartProvider wraps the app and provides cart state and actions to all components.
 *
 * - Uses useOptimistic for instant UI updates (before server confirms changes).
 * - Hydrates initial cart from a promise (server fetch).
 */
export function CartProvider({
  children,
  cartPromise,
}: {
  children: React.ReactNode;
  cartPromise: Promise<Cart | undefined>;
}) {
  const initialCart = use(cartPromise);
  const [optimisticCart, updateOptimisticCart] = useOptimistic(
    initialCart,
    (state, newCart: Cart) => ({
      ...state,
      ...newCart,
      lines: [...(newCart.lines || [])],
    })
  );
  // Update item quantity or remove item
  const updateCartItem = (merchendiseID: string, updateType: UpdateType) => {
    const newCart = cartReducer(optimisticCart, {
      type: 'UPDATE_ITEM',
      payload: { merchendiseID, updateType }
    });
    updateOptimisticCart(newCart);
  };
  // Add a new item to the cart
  const addCartItem = (variant: ProductVariant, product: Product) => {
    const newCart = cartReducer(optimisticCart, {
      type: 'ADD_ITEM',
      payload: { variant, product }
    });
    updateOptimisticCart(newCart);
  };
  return (
    <cartContext.Provider value={{ cart: optimisticCart, updateCartItem, addCartItem }}>
      {children}
    </cartContext.Provider>
  );
}

/**
 * Custom hook to access the cart context.
 * Throws an error if used outside a CartProvider.
 */
export function useCart() {
  const context = useContext(cartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
