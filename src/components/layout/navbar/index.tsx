import { getMenu } from "@/lib/shopify";

export default async function Navbar() {
    const menu = await getMenu("next-js-menu");
    console.log(menu)
  return (
    <nav>
        navbar
    </nav>
  );
}