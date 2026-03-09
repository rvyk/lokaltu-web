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

  useEffect(() => {
    if (!map || !isLoaded) return;

    const queryLat = searchParams.get("lat");
    const queryLng = searchParams.get("lng");

    if (queryLat && queryLng) {
      const lat = parseFloat(queryLat);
      const lng = parseFloat(queryLng);

      if (!isNaN(lat) && !isNaN(lng)) {
        const coordKey = `${queryLat},${queryLng}`;
        if (lastCoords.current !== coordKey) {
          map.flyTo({
            center: [lng, lat],
            zoom: 16,
            duration: 1500,
          });
          lastCoords.current = coordKey;
        }
      }
    } else if (latitude && longitude && lastCoords.current === null) {
      map.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        duration: 2000,
      });
      lastCoords.current = "user";
    }
  }, [latitude, longitude, map, isLoaded, searchParams]);

  return null;
}
