import type { HealthResponse } from "../types";
import axios from "axios";
import { env } from "@/config/env";

export async function fetchHealth() {
  const response = await axios.get<HealthResponse>(
    `${env.VITE_API_URL}/health`,
    {
      validateStatus: (status) => status === 200 || status === 503,
    }
  );

  return response.data;
}
