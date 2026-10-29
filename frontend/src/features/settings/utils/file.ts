import { env } from "@/config/env";
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

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function extractFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isValidFileFormat(fileformat: string | undefined) {
  return fileformat === "json" || fileformat === "csv";
}

export function isFileTooLarge(filesize: number) {
  return filesize > env.VITE_IMPORT_MAX_FILE_BYTES;
}

export function isFileEmpty(filesize: number) {
  return filesize === 0;
}
