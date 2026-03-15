"use client";

import { cn } from "@/lib/utils";
import * as heroicons_outline from "@heroicons/react/24/outline";
import * as heroicons_solid from "@heroicons/react/24/solid";

import { Nfc } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();
  return (
    <div className="fixed bottom-0 left-0 z-50 grid w-screen grid-cols-5 justify-between border-t bg-white px-6 pt-2 pb-4">
      {[
        {
          name: "Główna",
          icon: heroicons_outline.HomeIcon,
          activeIcon: heroicons_solid.HomeIcon,
          href: "/homescreen",
        },
        {
          name: "Mapa",
          icon: heroicons_outline.MapIcon,
          activeIcon: heroicons_solid.MapIcon,
          href: "/homescreen/map",
        },
        {
          name: "Skanuj",
          icon: false,
          href: "/homescreen/scan",
        },
        {
          name: "Statystyki",
          icon: heroicons_outline.ChartPieIcon,
          activeIcon: heroicons_solid.ChartPieIcon,
          href: "/homescreen/stats",
        },
        {
          name: "Konto",
          icon: heroicons_outline.UserCircleIcon,
          activeIcon: heroicons_solid.UserCircleIcon,
          href: "/homescreen/profile",
        },
      ].map((item) => (
        <Link href={item.href} key={item.name} className="h-full w-full">
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
            {typeof item.icon != "boolean" ? (
              <>
                {item.href == path ? (
                  <item.activeIcon className="h-7 text-[#59CA34]" />
                ) : (
                  <item.icon className="h-7 text-[#A0A4B0]" />
                )}
              </>
            ) : (
              <div className="relative h-full w-full">
                <div className="absolute left-1/2 -translate-x-1/2 -translate-y-[calc(50%+0.5rem)] scale-150 rounded-full bg-[#59CA34] p-1.5">
                  <Nfc className="-rotate-90 text-[#C6EBBA]" size={32} />
                </div>
              </div>
            )}
            <span
              className={cn(
                "text-sm font-medium text-nowrap",
                item.href == path ? "text-[#59CA34]" : "text-[#A0A4B0]",
              )}
            >
              {item.name}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
