// This file is all about rendering a list of filter options for search/sort in the UI.
import { SortFilterItem } from "@/lib/constants";
import FilterItemDropDown from "./dropdown";
import { FilterItem } from "./item";

export type PathFilterItem = { title: string; path: string };
export type ListItem = SortFilterItem | PathFilterItem;

function FilterItemList({ list }: { list: ListItem[] }) {
 
  return (
    <>
      {list.map((item: ListItem, i) => (
        <FilterItem key={i} item={item} />
      ))}
    </>
  );
}

export default function FilterList({
  list,
  title,
}: {
  list: ListItem[];
  title?: string;
}) {
  return (
    <>
      <nav>
        {title ? (
          <h3 className="hidden text-xs text-neutral-500 md:block dark:text-neutral-400">
            {title}
          </h3>
        ) : null}
        <ul className="hidden md:block">
          <FilterItemList list={list} />
        </ul>
        <ul className="md:hidden">
          <FilterItemDropDown list={list}  />
        </ul>
      </nav>
    </>
  );
}