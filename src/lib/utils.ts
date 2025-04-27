import { ReadonlyURLSearchParams } from "next/navigation";

// Ensures that a string starts with a specific substring. If it doesn't, prepends it.
export function ensureStartsWith(stringtoCheck: string, startsWith: string) {
  return stringtoCheck.startsWith(startsWith)
    ? stringtoCheck
    : `${startsWith}${stringtoCheck}`;
}

// Creates a URL by combining a pathname and search parameters.
// Converts the params to a query string and appends it to the pathname.
export function createUrl(pathname:string, params: URLSearchParams | ReadonlyURLSearchParams) : string {
  const paramsString = params.toString();
  const queryString = `${paramsString.length ? "?" : "" }${paramsString}` // Adds '?' if there are params
  return `${pathname}${queryString}`
}