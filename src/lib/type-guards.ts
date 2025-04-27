export type ShopifyErrorLike = {
  status: number;
  message: Error;
  cause: Error;
};

// Checks if a value is a non-null object (but not an array)
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
//Is this object an Error? If not, is its parent an Error? If not, is the grandparent an Error? ... keep checking up the chain until you find out.
function findError<T extends object>(error: T): boolean {
  if (Object.prototype.toString.call(error) === "[object Error]") {
    return true;
  }
  const prototype = Object.getPrototypeOf(error) as T | null;
  return prototype === null ? false : findError(prototype);
}

// Checks if a value matches the ShopifyErrorLike structure
export function isShopifyError(error: unknown): error is ShopifyErrorLike {
  if (!isObject(error)) return false;

  if (error instanceof Error) return true;
  if (typeof error === "object") return findError(error as object);
  return false;
}
