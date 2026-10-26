import { apiClient } from "@/lib/apiClient";
import type { ExportFileFormat } from "../types";
import { generateFilename, getFilenameFromDisposition } from "../utils";

export async function exportTeams(fileFormat: ExportFileFormat) {
  const response = await apiClient.get(`/teams/export?format=${fileFormat}`, {
    responseType: "blob",
  });

  const filename =
    getFilenameFromDisposition(response.headers["content-disposition"]) ??
    generateFilename(fileFormat);

  const contentType = response.headers["content-type"]?.toString() ?? "";
  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const tempLink = document.createElement("a");

  try {
    tempLink.href = url;
    tempLink.setAttribute("download", filename);

    document.body.appendChild(tempLink);
    tempLink.click();
  } finally {
    document.body.removeChild(tempLink);
    window.URL.revokeObjectURL(url);
  }

  return response;
}
