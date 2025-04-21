import Link from "next/link";
import Image from "next/image";

export const metadata = {
  description:
    "High-performance e-commerce store built with Next.js, Vercel, and Shopify.",
  openGraph: {
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="flex-1">
      <section className="w-full pt-12 md:pt-24 lg:pt-32 border-bottom-b">
        <div className="px-4 space-y-10 md:px-6 xl:space-y-16">
          <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
            <div>
              <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                Discover the Latest Fashion Trends
              </h1>
            </div>
            <div className="flex flex-col items-start space-y-4">
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Explore our curated collections of stylish apparel and
                accessories for every occasion.
              </p>
              <div className="flex flex-col w-full gap-2 md:flex-row text-nowrap">
                <Link
                  href="/search/womens-collection"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors border rounded-md shadow h-9 bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  prefetch={false}
                >
                  Shop Women
                </Link>
                <Link
                  href="/search/mens-collection"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors border rounded-md shadow-sm h-9 border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  prefetch={false}
                >
                  Shop Men
                </Link>
                <Link
                  href="/search/sales"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors border border-red-300 rounded-md shadow-sm h-9 border-input bg-background hover:bg-red-300 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  prefetch={false}
                >
                  Shop Sales
                </Link>
              </div>
            </div>
          </div>
          <Image
            src="/sales-banner.jpg"
            width={1000}
            height={300}
            alt="Hero"
            className="mx-auto max-h-[300px] rounded-t-xl object-cover"
            priority
          />
        </div>
      </section>
      <section className="grid w-full py-12 md:py-24 lg:py-32 place-content-center">
        <div className="container px-4 space-y-12 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 text-sm rounded-lg bg-muted">
                New Arrivals
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Trending Now
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Check out our latest collection of stylish and comfortable
                clothing.
              </p>
            </div>
          </div>
          <div className="grid items-center justify-center gap-8 mx-auto sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl ">
          
            <div className="grid gap-1">
              <Link
                href="/search/mens-collection"
                className="group"
                prefetch={false}
              >
                <Image
                  src="/mens-collection.png"
                  width={400}
                  height={500}
                  alt="Men's Collection"
                  className="aspect-[4/5] overflow-hidden rounded-lg object-cover group-hover:scale-105 transition-transform"
                />
                <h3 className="mt-4 text-lg font-bold text-center group-hover:underline">
                  Men\&apos;s Collection
                </h3>
              </Link>
            </div>
            <div className="grid gap-1">
              <Link href="/search/kids" className="group" prefetch={false}>
                <Image
                  src="/kids-collection.png"
                  width={400}
                  height={500}
                  alt="Kids' Collection"
                  className="aspect-[4/5] overflow-hidden rounded-lg object-cover group-hover:scale-105 transition-transform"
                />
                <h3 className="mt-4 text-lg font-bold text-center group-hover:underline">
                  Kids\&apos;s Collection
                </h3>
              </Link>
            </div>
   
          </div>
        </div>
      </section>
      <section className="w-full py-12 lg:py-7 bg-[url('/sale-backdrop.svg')] bg-no-repeat bg-cover grid place-content-center">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <Image src="/sale-banner.svg" width={800} height={200} alt="sale footer banner" />
          <div className="z-50 space-y-3">
            <div className="bg-white dark:bg-black">
              <h2 className="p-2 text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Explore Our Sale Collection
              </h2>
            </div>
            <div className="bg-white">
              <p className="mx-auto max-w-[600px] text-black md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed p-2">
                Don&apos;t miss out on our amazing deals and discounts.
              </p>
            </div>
          </div>
          <div className="z-50 w-full max-w-sm mx-auto space-y-2">
            <Link
              href="#"
              className="inline-flex items-center justify-center h-10 px-8 text-sm font-medium transition-colors rounded-md shadow bg-slate-200 dark:bg-black text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              prefetch={false}
            >
              Shop Sale
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}