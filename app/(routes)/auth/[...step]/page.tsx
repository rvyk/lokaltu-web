import noise from "@/app/assets/sign-in/noise.png";
import BgPhotos from "@/components/bg-photos";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import type { Metadata } from "next";
import { redirect, RedirectType } from "next/navigation";
import AuthClient from "./_components/auth-client";

export const metadata: Metadata = {
  title: "Logowanie i rejestracja",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AuthPage({
  params,
}: {
  params: Promise<{ step: string[] }>;
}) {
  const { step } = await params;
  const currentStep = step?.[0] || "sign-up";
  const user = await currentUser();

  if (user && currentStep !== "verify-second-factor") {
    return redirect("/", RedirectType.replace);
  }

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
        <div className="w-full max-w-md">
          <AuthClient step={currentStep} />
        </div>
      </div>
    </div>
  );
}
