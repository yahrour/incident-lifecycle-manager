import { format } from "date-fns";

export function formatDuration(
  startDate: Date | string,
  endDate: Date | string
) {
  return (
    format(new Date(startDate), "MMM dd") +
    " - " +
    format(new Date(endDate), "MMM dd")
  );
}
