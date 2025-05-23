import { getMenu } from "@/lib/shopify";
import { Menu } from "@/lib/shopify/types";
import Link from "next/link";
import MobileMenu from "./mobile-menu";
import Search from "./search";
import LogoIcon from "@/components/logo-squared";
import CartModal from "@/components/cart/modal";

export default async function Navbar() {
    const menu = await getMenu("next-js-menu");
  return (
    <nav className="flex items-center justify-between p-4 lg:px-6 sticky top-0 backdrop-blur-sm z-[100]">
    <div className="flex-none block md:hidden">
      <MobileMenu menu={menu} />
    </div>
    <div className="flex items-center w-full juseCallback(
      () => {
        first
      },
      [second],
    )
    tify-ev">
      <div className="flex grow md:max-w-[40%]">
        <Link
          href={"/"}
          prefetch={true}
          className="flex items-center justify-center w-full mr-2 md:w-auto lg:mr-6"
        >
          <LogoIcon />
          <div className="flex-none ml-2 text-sm font-medium uppercase md:hidden lg:block">
            {process.env.SITE_NAME}
          </div>
        </Link>

        {menu.length > 0 ? (
          <ul className="hidden gap-6 text-sm md:flex md:items-center">
            {menu.map((item: Menu) => (
              <li key={item.title}>
                <Link
                  href={item.path}
                  prefetch={true}
                  className="text-gray-700 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="justify-center hidden md:flex grow">
        <Search />
      </div>
      <div className="flex justify-end grow">
        <CartModal />
      </div>
    </div>
  </nav>
  );
}