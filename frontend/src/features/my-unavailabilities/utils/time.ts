import { format } from "date-fns";

export function formatDuration(
  startDate: Date | string,
  endDate: Date | string
) {
  return (
    format(new Date(startDate), "yyyy-MM-dd") +
    " - " +
    format(new Date(endDate), "yyyy-MM-dd")
  );
}
