import type { ExportFileFormat } from "../types";

export function getContentType(format: ExportFileFormat) {
  return format === "json" ? "application/json" : "text/csv";
}
