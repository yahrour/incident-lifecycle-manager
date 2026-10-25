import type { ExportFileFormat } from "../types";
import { format } from "date-fns";

export function generateFilename(fileFormat: ExportFileFormat) {
  const timestamp = format(new Date(), "yyyy-MM-dd");
  const filename = `teams-${timestamp}.${fileFormat}`;
  return filename;
}
