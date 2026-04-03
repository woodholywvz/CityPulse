"use client";

import { useState } from "react";

type UserLocation = {
  latitude: number;
  longitude: number;
};

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestLocation() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setError("Location access is unavailable on this device.");
      return null;
    }

    setIsLoading(true);
    setError(null);

    const result = await new Promise<UserLocation | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => resolve(null),
        {
          enableHighAccuracy: true,
          maximumAge: 60_000,
          timeout: 10_000,
        },
      );
    });

    setIsLoading(false);

    if (!result) {
      setError("Location access is unavailable on this device.");
      return null;
    }

    setLocation(result);
    return result;
  }

  return {
    location,
    isLoading,
    error,
    requestLocation,
    setLocation,
  };
}
