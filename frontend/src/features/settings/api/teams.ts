import { apiClient } from "@/lib/apiClient";
import type { ExportFileFormat } from "../types";
import { getContentType, generateFilename } from "../utils";

export async function exportTeams(fileFormat: ExportFileFormat) {
  const response = await apiClient.get(`/teams/export?format=${fileFormat}`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: getContentType(fileFormat) });
  const url = window.URL.createObjectURL(blob);
  const tempLink = document.createElement("a");
  try {
    tempLink.href = url;
    tempLink.setAttribute("download", generateFilename(fileFormat));

    document.body.appendChild(tempLink);
    tempLink.click();
  } finally {
    document.body.removeChild(tempLink);
    window.URL.revokeObjectURL(url);
  }

  return response;
}
