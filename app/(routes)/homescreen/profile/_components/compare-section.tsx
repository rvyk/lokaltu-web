"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { QrCode, ScanLine, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function CompareSection({ userId }: { userId: string }) {
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const compareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/homescreen/profile/${userId}?compare=true`
      : "";

  const stopScanner = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleScannedUrl = useCallback(
    (url: string) => {
      stopScanner();
      setScannerOpen(false);

      // Extract userId from the URL - supports both full URLs and paths
      const comparePattern =
        /\/homescreen\/profile\/([^/?]+)(?:\?compare=true)?/;
      const match = url.match(comparePattern);

      if (match?.[1]) {
        router.push(`/homescreen/profile/${match[1]}?compare=true`);
      } else {
        alert("Nieprawidłowy kod QR. Spróbuj ponownie.");
      }
    },
    [stopScanner, router],
  );

  const startScanner = useCallback(async () => {
    setScanError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Use BarcodeDetector API if available
      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });

        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const url = barcodes[0].rawValue;
              handleScannedUrl(url);
            }
          } catch {
            // Detection error, continue scanning
          }
        }, 300);
      } else {
        setScanError(
          "Twoja przeglądarka nie obsługuje skanowania kodów QR. Użyj aplikacji aparatu, aby zeskanować kod.",
        );
      }
    } catch {
      setScanError("Nie udało się uruchomić kamery. Sprawdź uprawnienia.");
    }
  }, [handleScannedUrl]);

  useEffect(() => {
    if (scannerOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [scannerOpen, startScanner, stopScanner]);

  return (
    <>
      <div className="flex gap-3">
        {/* Show My QR Code */}
        <Drawer>
          <DrawerTrigger asChild>
            <button className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-[#84cc16]/20 bg-white text-base font-bold text-[#49BF12] transition-all hover:bg-[#f0fce8] active:scale-[0.98]">
              <QrCode className="h-5 w-5" />
              Mój kod QR
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="text-center text-lg font-bold text-gray-800">
                Twój kod QR
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col items-center gap-4 px-6 pb-8">
              <p className="text-center text-sm text-gray-400">
                Pokaż ten kod znajomemu, aby mógł zobaczyć Twoje statystyki bez
                dodawania do znajomych.
              </p>
              {compareUrl && (
                <div className="rounded-3xl border-2 border-gray-100 bg-white p-6 shadow-sm">
                  <QRCodeSVG
                    value={compareUrl}
                    size={200}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#1f2937"
                  />
                </div>
              )}
              <p className="max-w-[250px] text-center text-xs text-gray-300">
                Kod zawiera link do Twojego publicznego profilu
              </p>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl text-base font-semibold"
                >
                  Zamknij
                </Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Scan QR Code */}
        <button
          onClick={() => setScannerOpen(true)}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#84cc16] text-base font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-[#71af12] active:scale-[0.98]"
        >
          <ScanLine className="h-5 w-5" />
          Skanuj kod
        </button>
      </div>

      {/* QR Scanner Fullscreen Overlay */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-6 pt-12 pb-4">
            <h2 className="text-lg font-bold text-white">Skanuj kod QR</h2>
            <button
              onClick={() => setScannerOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            {/* Scanning frame overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-3xl border-4 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
            </div>
          </div>

          {scanError && (
            <div className="px-6 pb-8 pt-4">
              <p className="rounded-2xl bg-red-500/20 p-4 text-center text-sm font-medium text-red-200">
                {scanError}
              </p>
            </div>
          )}

          <div className="px-6 pb-12 pt-4">
            <p className="text-center text-sm text-white/60">
              Skieruj kamerę na kod QR znajomego
            </p>
          </div>
        </div>
      )}
    </>
  );
}
