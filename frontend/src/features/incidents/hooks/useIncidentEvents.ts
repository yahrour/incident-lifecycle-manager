import { env } from "@/config/env";
import { queryClient } from "@/lib/queryClient";
import { useEffect } from "react";

export function useIncidentEvents() {
  useEffect(() => {
    let source: EventSource;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      source = new EventSource(`${env.VITE_API_URL}/incidents/events`, {
        withCredentials: true,
      });
      source.onmessage = (event: MessageEvent<string>) => {
        const { id } = JSON.parse(event.data) as { id: string };
        void queryClient.invalidateQueries({ queryKey: ["incidents"] });
        void queryClient.invalidateQueries({ queryKey: ["incident", id] });
      };
      source.onerror = () => {
        if (source.readyState !== EventSource.CLOSED) return;
        void queryClient.invalidateQueries({ queryKey: ["incidents"] });
        void queryClient.invalidateQueries({ queryKey: ["incident"] });
        retry = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      clearTimeout(retry);
      source.close();
    };
  }, []);
}
