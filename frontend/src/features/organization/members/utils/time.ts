import { format } from "date-fns";

export function formatJoined(date: Date | string) {
  return format(new Date(date), "dd/MM/yyyy");
}
