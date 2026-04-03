"use client";

import type { DependencyList } from "react";
import { useEffect, useRef, useState } from "react";

import { reportClientEvent } from "@/lib/observability";

type AsyncResourceOptions<T> = {
  initialValue: T;
  enabled?: boolean;
  load: () => Promise<T>;
  deps: DependencyList;
};

export function useAsyncResource<T>({
  initialValue,
  enabled = true,
  load,
  deps,
}: AsyncResourceOptions<T>) {
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loadRef = useRef(load);
  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    async function run() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await loadRef.current();
        if (!isActive) {
          return;
        }
        setData(result);
      } catch (loadError) {
        if (!isActive) {
          return;
        }
        const message =
          loadError instanceof Error ? loadError.message : "Unable to load data.";
        reportClientEvent({
          name: "async_resource_load_failed",
          error: loadError,
          context: {
            dependency_key: depsKey,
          },
        });
        setError(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      isActive = false;
    };
  }, [depsKey, enabled, reloadKey]);

  return {
    data,
    isLoading,
    error,
    setData,
    reload: () => setReloadKey((current) => current + 1),
  };
}
