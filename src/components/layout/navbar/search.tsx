"use client";
import { createUrl } from "@/lib/utils";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function Search() {
  const router = useRouter();
  //  provides access to the current query string, so we can sync the input with the URL.
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState("");

  // Keep the input value in sync with the URL's 's' query param.
  // to ensures the search box always reflects the current search state, even on navigation.
  useEffect(() => {
    setSearchValue(searchParams?.get("s") || "");
  }, [searchParams]);

  //  updates the URL with the new search param.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const val = e.target as HTMLFormElement;
    const search = val.search as HTMLInputElement;
    const newParams = new URLSearchParams(searchParams.toString());

    if (search.value) {
      newParams.set("s", search.value);
    } else {
      newParams.delete("s");
    }

    router.push(createUrl("/search", newParams));
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-max-[550px] relative w-full lg:w-80 xl:w-full"
    >
      <input
        type="text"
        name="search"
        placeholder="Search for products..."
        autoComplete="off"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="w-full px-4 py-2 text-black bg-white border rounded-lg text-md placeholder:text-neutral-500 md:text-sm dark:border-neutral-800 dark:bg-transparent dark:text-white dark:placeholder:text-neutral-400"
      />
      <div className="absolute top-0 right-0 flex items-center h-full mr-3">
        <MagnifyingGlassIcon className="h-4" />
      </div>
    </form>
  );
}

export function SearchSkeleton() {
  return (
    <form className="w-max-[550px] relative w-full lg:w-80 xl:w-full">
      <input
        type="text"
        placeholder="Search for products..."
        className="w-full px-4 py-2 text-sm text-black bg-white border rounded-lg placeholder:text-neutral-500 dark:border-neutral-800 dark:bg-transparent dark:text-white dark:placeholder:text-neutral-400"
      />
      <div className="absolute top-0 right-0 flex items-center h-full mr-3">
        <MagnifyingGlassIcon className="h-4" />
      </div>
    </form>
  );
}