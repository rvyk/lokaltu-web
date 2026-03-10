"use client";

import { useMap } from "@/components/ui/map";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

interface MapAutoCentererProps {
  latitude: number | null;
  longitude: number | null;
}

export function MapAutoCenterer({ latitude, longitude }: MapAutoCentererProps) {
  const { map, isLoaded } = useMap();
  const searchParams = useSearchParams();
  const lastCoords = useRef<string | null>(null);
  const hasHandledQuery = useRef(false);

  // Handle query-param-based fly (from NearbyShops navigation)
  // This runs separately to ensure it always takes priority
  useEffect(() => {
    if (!map || !isLoaded) return;

    const queryLat = searchParams.get("lat");
    const queryLng = searchParams.get("lng");

    if (!queryLat || !queryLng) return;

    const lat = parseFloat(queryLat);
    const lng = parseFloat(queryLng);
    if (isNaN(lat) || isNaN(lng)) return;

    const coordKey = `${queryLat},${queryLng}`;
    if (lastCoords.current === coordKey) return;

    lastCoords.current = coordKey;
    hasHandledQuery.current = true;

    // Wait for the map to be fully idle before flying
    // This prevents flyTo from being swallowed during initial style load
    const doFly = () => {
      map.flyTo({
        center: [lng, lat],
        zoom: 16,
        duration: 1500,
      });
    };

    if (map.isStyleLoaded()) {
      doFly();
    } else {
      map.once("idle", doFly);
    }
  }, [map, isLoaded, searchParams]);

  // Fallback: center on user location if no query params
  useEffect(() => {
    if (!map || !isLoaded) return;
    if (hasHandledQuery.current) return;
    if (!latitude || !longitude) return;
    if (lastCoords.current !== null) return;

    lastCoords.current = "user";
    map.flyTo({
      center: [longitude, latitude],
      zoom: 14,
      duration: 2000,
    });
  }, [latitude, longitude, map, isLoaded]);

  return null;
}
