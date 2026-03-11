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
import { useQrScanner } from "@/lib/hooks/use-qr-scanner";
import { QrCode, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function CompareSection({ userId }: { userId: string }) {
  const router = useRouter();
  const { scanning, scanQr } = useQrScanner();

  const compareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/homescreen/profile/${userId}?compare=true`
      : "";

  const handleScanQr = async () => {
    try {
      const scannedValue = await scanQr();

      // Extract userId from the scanned URL
      const comparePattern =
        /\/homescreen\/profile\/([^/?]+)(?:\?compare=true)?/;
      const match = scannedValue.match(comparePattern);

      if (match?.[1]) {
        router.push(`/homescreen/profile/${match[1]}?compare=true`);
      } else {
        alert("Nieprawidłowy kod QR. Spróbuj ponownie.");
      }
    } catch (e) {
      if (e instanceof Error && e.message === "cancelled") {
        // User cancelled, do nothing
        return;
      }
      alert(
        e instanceof Error
          ? e.message
          : "Wystąpił błąd podczas skanowania.",
      );
    }
  };

  return (
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
                className="h-12 w-full rounded-2xl border-2 border-[#84cc16]/20 bg-white text-base font-bold text-[#49BF12] hover:bg-[#f0fce8]"
              >
                Zamknij
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Scan QR Code */}
      <button
        onClick={handleScanQr}
        disabled={scanning}
        className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#84cc16] text-base font-bold text-white transition-all hover:bg-[#71af12] active:scale-[0.98] disabled:opacity-50"
      >
        <ScanLine className="h-5 w-5" />
        {scanning ? "Skanowanie..." : "Skanuj kod"}
      </button>
    </div>
  );
}
