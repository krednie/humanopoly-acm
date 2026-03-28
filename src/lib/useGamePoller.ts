import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseGamePollerOptions {
  /** Polling interval in milliseconds. Default: 3000 */
  intervalMs?: number;
  /** Called once when the first successful response arrives */
  onFirstLoad?: () => void;
}

/**
 * Polls a game state endpoint on a fixed interval.
 * Redirects to "/" on 401. Type-param T is the expected response shape.
 */
export function useGamePoller<T>(route: string, options: UseGamePollerOptions = {}) {
  const { intervalMs = 3000, onFirstLoad } = options;
  const router = useRouter();
  const [state, setState] = useState<T | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${route}?t=${Date.now()}`);
      if (res.status === 401) { router.push("/"); return; }
      if (!res.ok) return;
      const data: T = await res.json();
      setState((prev) => {
        if (prev === null && onFirstLoad) onFirstLoad();
        return data;
      });
    } catch { /* network errors are silently ignored during polling */ }
  }, [route, router, onFirstLoad]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, intervalMs);
    return () => clearInterval(id);
  }, [fetchState, intervalMs]);

  return { state, refetch: fetchState };
}
