import type { ExportFileFormat } from "../types";
import { format } from "date-fns";

export function generateFilename(fileFormat: ExportFileFormat) {
  const timestamp = format(new Date(), "yyyy-MM-dd");
  const filename = `teams-${timestamp}.${fileFormat}`;
  return filename;
}

const FILENAME_REGEX = /^.*filename[^;=\n]*=((['"]).*?\2|[^;\n]*)[\n;]?$/i;

export function getFilenameFromDisposition(
  header: unknown
): string | undefined {
  if (typeof header !== "string") return undefined;

  const match = FILENAME_REGEX.exec(header);
  // group 1 still includes the surrounding quotes, so strip them
  return match?.[1]?.replace(/['"]/g, "").trim() || undefined;
}
