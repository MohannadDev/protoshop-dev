"use server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/constants";
import { addToCart, createCart, getCart, removeFromCart, updateCart } from "@/lib/shopify";
import { redirect } from "next/navigation";

export async function addItem(
  //   prevState: any,
  prevState: unknown,
  selectedVariantID: string | undefined
) {
  const cartId = (await cookies()).get("cartId")?.value;
  if (!cartId || !selectedVariantID) {
    console.error("Missing cartId or selectedVariantID:", { cartId, selectedVariantID });
    return "Error adding item to cart";
  }

  try {
    await addToCart(cartId, [
      { merchandiseId: selectedVariantID, quantity: 1 },
    ]);
    revalidateTag(TAGS.cart);
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return "Error adding item to cart";
  }
}

export async function removeItem(prevState: unknown, merchandiseId: string) {
  const cartId = (await cookies()).get("cartId")?.value;
  if (!cartId) return "Missing cart ID";
  try {
    const cart = await getCart(cartId);
    if (!cart) return "Error fetching cart";

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId
    );
    if (lineItem && lineItem.id) {
      await removeFromCart(cartId, [lineItem.id]);
      revalidateTag(TAGS.cart);
    } else {
      return "Item not found in cart";
    }
  } catch (error) {
    console.log(error)
    return "Error removing item from cart";
  }
}
export async function updateItemQuantity(
  prevState: unknown,
  payload: {
    merchandiseId: string;
    quantity: number;
  }
) {
  const cartId = (await cookies()).get("cartId")?.value;
  if (!cartId) {
    return "Missing cart ID";
  }

  const { merchandiseId, quantity } = payload;

  try {
    const cart = await getCart(cartId);
    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId
    );

    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        await removeFromCart(cartId, [lineItem.id]);
      } else {
        await updateCart(cartId, [
          {
            id: lineItem.id,
            merchandiseId,
            quantity,
          },
        ]);
      }
    } else if (quantity > 0) {
      // If the item doesn't exist in the cart and quantity > 0, add it
      await addToCart(cartId, [{ merchandiseId, quantity }]);
    }

    revalidateTag(TAGS.cart);
  } catch (error) {
    console.error(error);
    return "Error updating item quantity";
  }
}
export async function redirectToCheckout() {
  const cartId = (await cookies()).get("cartId")?.value;

  if (!cartId) {
    throw new Error("Missing cart ID");
  }

  const cart = await getCart(cartId);

  if (!cart) {
    throw new Error("Error fetching cart");
  }

  redirect(cart.checkoutUrl);
}
export async function createCartAndSetCookie() {
  const cart = await createCart();
  (await cookies()).set("cartId", cart.id!);
}

export async function initializeCart() {
  try {
    const cookieStore = await cookies();
    const cartId = cookieStore.get("cartId")?.value;
    
    if (!cartId) {
      const cart = await createCart();
      if (!cart.id) throw new Error("Failed to create cart");
      
      // Set cookie with appropriate options
      cookieStore.set("cartId", cart.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      
      return { cart: await getCart(cart.id), cartId: cart.id };
    }
    
    const cart = await getCart(cartId);
    if (!cart) {
      // If cart not found, create a new one
      const newCart = await createCart();
      if (!newCart.id) throw new Error("Failed to create cart");
      
      cookieStore.set("cartId", newCart.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      
      return { cart: await getCart(newCart.id), cartId: newCart.id };
    }
    
    return { cart, cartId };
  } catch (error) {
    console.error('Error initializing cart:', error);
    return { cart: null, cartId: null };
  }
}