"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ListItem, type PathFilterItem } from ".";
import Link from "next/link";
import { createUrl } from "@/lib/utils";
import type { SortFilterItem } from "@/lib/constants";
import clsx from "clsx";

function PathFilterItem({ item }: { item: PathFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === item.path;
  const newParams = new URLSearchParams(searchParams.toString());
  const DynamicTag = active ? "p" : Link;
  newParams.delete("s");
  return (
    <li className="flex mt-2 text-black dark:text-white" key={item.title}>
      <DynamicTag
        href={createUrl(item.path, newParams)}
        className={clsx(
          "w-full text-sm underline-offset-4 hover:underline dark:hover:text-neutral-100",
          {
            "underline underline-offset-4": active,
          }
        )}
      >
        {item.title}
      </DynamicTag>
    </li>
  );
}

function SortFilterItem({ item }: { item: SortFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("sort") === item.slug;
  const s = searchParams.get("s");

  const href = createUrl(
    pathname,
    new URLSearchParams({
      ...(s && { s }),
      ...(item.slug && item.slug.length && { sort: item.slug }),
    })
  );

  const DynamicTag = active ? "p" : Link;

  return (
    <li
      className="flex mt-2 text-sm text-black dark:text-white"
      key={item.title}
    >
      <DynamicTag
        prefetch={!active ? false : undefined}
        href={href}
        className={clsx("w-full hover:underline hover:underline-offset-4", {
          "underline underline-offset-4": active,
        })}
      >
        {item.title}
      </DynamicTag>
    </li>
  );
}

export function FilterItem({ item }: { item: ListItem }) {
  return "path" in item ? (
    <PathFilterItem item={item} />
  ) : (
    <SortFilterItem item={item} />
  );
}