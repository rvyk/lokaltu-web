import { getUserDb } from "@/app/actions/user";
import { amIAdmin } from "@/app/actions/admin";
import { getLevel } from "@/lib/utils/leveling";
import { currentUser } from "@clerk/nextjs/server";
import {
  Briefcase,
  Shield,
  Award,
  ChevronRight,
  FilePlus2,
  Flag,
  Settings,
  UserCircle2,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CompareSection from "./_components/compare-section";

export default async function ProfilePage() {
  const user = await currentUser();
  const [userDb, admin] = await Promise.all([getUserDb(), amIAdmin()]);
  const isAdmin = !!admin;

  const points = userDb?.lokaltuPoints ?? 0;
  const level = getLevel(points);

  const mainMenuItems = [
    {
      label: "Moja torba NFC",
      icon: <Briefcase className="h-6 w-6 text-gray-800" />,
      href: "/homescreen/profile/bag",
    },
    {
      label: "Zdobyte odznaki",
      icon: <Award className="h-6 w-6 text-gray-800" />,
      href: "/homescreen/profile/badges",
    },
    {
      label: "Znajomi",
      icon: <Users className="h-6 w-6 text-gray-800" />,
      href: "/homescreen/profile/friends",
    },
    {
      label: "Moje zgłoszenia",
      icon: <Flag className="h-6 w-6 text-gray-800" />,
      href: "/homescreen/profile/submissions",
    },
    {
      label: "Moje posty",
      icon: <FilePlus2 className="h-6 w-6 text-gray-800" />,
      href: "/homescreen/profile/posts",
    },
    {
      label: "Ustawienia aplikacji",
      icon: <Settings className="h-6 w-6 text-gray-800" />,
      href: "/homescreen/profile/settings",
    },
  ];

  const adminMenuItems = isAdmin
    ? [
        {
          label: "Pula toreb NFC",
          icon: <Shield className="h-6 w-6 text-gray-800" />,
          href: "/homescreen/profile/bag-admin",
        },
      ]
    : [];

  return (
    <div className="relative min-h-screen bg-white pt-24">
      <div className="absolute top-0 left-0 h-50 w-full bg-[linear-gradient(249.58deg,#61F681_0%,#49BF12_49.21%,#DBC443_97.83%)] pt-8">
        <div className="mb-2 px-6">
          <h1 className="truncate pt-6 text-2xl font-semibold text-[#E3F8D9]">
            Cześć, {user?.firstName || userDb?.name || "Użytkowniku"}!
          </h1>
        </div>
      </div>

      <div className="relative h-full w-full space-y-6 rounded-t-2xl bg-white px-6 pt-8 pb-32 transition-all">
        <div className="mb-8 flex items-center gap-6 pt-4">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-md">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt="Profile"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#E5E7EB]">
                <UserCircle2 className="h-14 w-14 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-base leading-tight font-medium text-gray-400">
              Poziom {level.level}:
            </span>
            <span className="text-xl font-bold tracking-tight text-gray-800">
              {level.name}
            </span>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-gray-50">
          {mainMenuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="group flex cursor-pointer items-center justify-between py-5 transition-all active:opacity-60"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors group-active:bg-gray-50">
                  {item.icon}
                </div>
                <span className="text-lg font-semibold tracking-tight text-gray-700">
                  {item.label}
                </span>
              </div>
              <ChevronRight className="h-6 w-6 stroke-[2.5px] text-[#84cc16]" />
            </Link>
          ))}
        </div>

        {isAdmin && (
          <div className="space-y-2 pt-2">
            <h2 className="text-sm font-black tracking-widest text-gray-400 uppercase">
              Administrator
            </h2>
            <div className="flex flex-col divide-y divide-gray-50 rounded-2xl border border-gray-100 px-1">
              {adminMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex cursor-pointer items-center justify-between py-5 transition-all active:opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 transition-colors group-active:bg-gray-100">
                      {item.icon}
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-gray-700">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="h-6 w-6 stroke-[2.5px] text-[#84cc16]" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {userDb && (
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-black tracking-widest text-gray-400 uppercase">
              Porównaj ze znajomym
            </h2>
            <p className="text-sm text-gray-400">
              Pokaż swój kod QR lub zeskanuj czyjś, aby porównać statystyki bez
              dodawania do znajomych.
            </p>
            <CompareSection userId={userDb.id} />
          </div>
        )}
      </div>
    </div>
  );
}
