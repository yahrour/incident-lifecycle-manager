export function hasSessionHint(): boolean {
  return document.cookie
    .split("; ")
    .some((cookie) => cookie === "hasSession=1");
}
