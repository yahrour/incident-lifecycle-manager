import { DateTime } from "luxon";
import { DEFAULT_TIMEZONE } from "../constants";

export function convertDateToUtc(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE,
  endOfDay = false
) {
  const dateUtc = DateTime.fromObject(
    {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    },
    { zone: timezone }
  )
    .set(
      endOfDay
        ? { hour: 23, minute: 59, second: 59, millisecond: 999 }
        : { hour: 0, minute: 0, second: 0, millisecond: 0 }
    )
    .toUTC()
    .toJSDate();

  return dateUtc;
}
