"use client";

import { getMapPlaces } from "@/app/actions/places";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
} from "@/components/ui/map";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { MapPin, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AddPlaceDialog } from "./add-place-dialog";
import { ClusterHandler } from "./cluster-handler";
import { MapAutoCenterer } from "./map-auto-centerer";
import { MapClickHandler } from "./map-click-handler";
import { UserLocationMarker } from "./user-location-marker";

type MapPlace = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  image: string | null;
  description: string | null;
  verified: boolean;
  creatorId: string | null;
};

export function MapClient() {
  const { latitude, longitude } = useGeolocation();
  const searchParams = useSearchParams();
  const [isPicking, setIsPicking] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(
    searchParams.get("id"),
  );
  const lastInjectedId = useRef<string | null>(searchParams.get("id"));

  // Sync selected place with query param - response to navigation from feed
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setSelectedPlaceId(id);
      lastInjectedId.current = id;
    }
  }, [searchParams]);

  // Fetch places on mount
  useEffect(() => {
    getMapPlaces().then(setPlaces);
  }, []);

  // Refresh places after adding
  const refreshPlaces = useCallback(() => {
    getMapPlaces().then(setPlaces);
  }, []);

  const handleStartPicking = useCallback(() => {
    setIsPicking(true);
    setSelectedPlaceId(null);
  }, []);

  const handleMapPick = useCallback((lngLat: { lng: number; lat: number }) => {
    setPickedLocation({ lat: lngLat.lat, lng: lngLat.lng });
    setIsPicking(false);
  }, []);

  const handleCancelPicking = useCallback(() => {
    setIsPicking(false);
  }, []);

  const handleClearPicked = useCallback(() => {
    setPickedLocation(null);
    refreshPlaces();
  }, [refreshPlaces]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-neutral-50 text-black">
      <Map theme="light" attributionControl={false} maxZoom={19}>
        <MapControls
          showLocate
          position="bottom-right"
          className="mb-28"
          userLocation={
            typeof latitude === "number" && typeof longitude === "number"
              ? { latitude, longitude }
              : null
          }
        />

        <MapAutoCenterer latitude={latitude} longitude={longitude} />

        {typeof latitude === "number" && typeof longitude === "number" && (
          <UserLocationMarker latitude={latitude} longitude={longitude} />
        )}

        {/* Clustered Place markers */}
        <ClusterHandler
          places={places}
          selectedPlaceId={selectedPlaceId}
          setSelectedPlaceId={setSelectedPlaceId}
        />

        {/* Picking mode handler */}
        {isPicking && <MapClickHandler onPick={handleMapPick} />}
        {isPicking && pickedLocation && (
          <MapMarker
            longitude={pickedLocation.lng}
            latitude={pickedLocation.lat}
          >
            <MarkerContent>
              <div className="bg-main flex h-9 w-9 items-center justify-center rounded-full shadow-lg ring-4 ring-white/50">
                <MapPin className="h-5 w-5 text-white" />
              </div>
            </MarkerContent>
          </MapMarker>
        )}
      </Map>

      {/* Picking mode overlay */}
      {isPicking && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-center">
            <div className="animate-in fade-in zoom-in rounded-2xl bg-black/70 px-6 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-md duration-300">
              Kliknij na mapie, aby wybrać lokalizację
            </div>
          </div>
          <button
            onClick={handleCancelPicking}
            className="absolute top-12 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <X className="h-5 w-5 text-neutral-600" />
          </button>
        </>
      )}

      {/* FAB - repositioned under map controls */}
      <div className="fixed right-4 bottom-22 z-10 transition-transform">
        <AddPlaceDialog
          onStartPicking={handleStartPicking}
          pickedLocation={pickedLocation}
          onClearPicked={handleClearPicked}
          isPicking={isPicking}
          onSuccess={refreshPlaces}
          userLocation={
            typeof latitude === "number" && typeof longitude === "number"
              ? { latitude, longitude }
              : null
          }
        />
      </div>
    </div>
  );
}
