import { NextResponse } from "next/server";
import { createCart } from "@/lib/shopify";
import { cookies } from "next/headers";

export async function POST() {
  const cart = await createCart();
  if (!cart?.id) {
    return NextResponse.json({ error: "Failed to create cart" }, { status: 500 });
  }
  (await cookies()).set("cartId", cart.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return NextResponse.json({ cartId: cart.id });
} 