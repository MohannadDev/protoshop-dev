export function ensureStartsWith(stringtoCheck: string, startsWith: string) {
  return stringtoCheck.startsWith(startsWith)
    ? stringtoCheck
    : `${startsWith}${stringtoCheck}`;
}
