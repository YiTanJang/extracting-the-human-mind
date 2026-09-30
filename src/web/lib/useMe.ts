"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Me } from "./api";

/**
 * Loads the current participant and routes them to where they belong:
 * no session → landing, consent outdated → consent page (unless `allowWithoutConsent`).
 */
export function useMe({ allowWithoutConsent = false } = {}) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await api<Me>("/me");
      if (!data.consent.is_current && !allowWithoutConsent) {
        router.replace("/consent");
        return;
      }
      setMe(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.replace("/");
    }
  }, [router, allowWithoutConsent]);

  useEffect(() => {
    // Initial load; subscribing to an external system (the API) is what effects are for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  return { me, setMe, reload };
}
