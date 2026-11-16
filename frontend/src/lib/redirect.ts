import type { Role } from "@/types";

export function getSafeRedirect(value: string | null): string | null {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return null;
  }
  return value;
}

export function getDashboardPath(role: Role): string {
  switch (role) {
    case "SRE":
      return "/manager/teams";
    case "ENGINEER":
      return "/engineer/my-team";
    default:
      return "/login";
  }
}
