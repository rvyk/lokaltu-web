"use client";

import noise from "@/app/assets/sign-in/noise.png";
import BgPhotos from "@/components/bg-photos";
import Image from "next/image";

export function CompleteProfileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto">
      <div className="fixed inset-0 -z-50">
        <BgPhotos />
        <div className="absolute inset-0 bg-white/60"></div>
        <Image
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          src={noise}
          alt="Background noise"
        />
      </div>

      <div className="grid min-h-screen w-full place-items-center bg-white/40 px-6 py-12 backdrop-blur-sm">
        <div className="anim-fade-in-up w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
