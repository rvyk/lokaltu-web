import { getUserPublicProfile } from "@/app/actions/user";
import { getLevel } from "@/lib/utils/leveling";
import { ChevronLeft, Trophy, UserCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import FriendshipButton from "./_components/friendship-button";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ compare?: string }>;
}) {
  const { userId } = await params;
  const { compare } = await searchParams;
  const isCompareMode = compare === "true";
  const profile = await getUserPublicProfile(userId);

  if (!profile) {
    notFound();
  }

  if (profile.isMe && !isCompareMode) {
    redirect("/homescreen/profile");
  }

  const level = getLevel(profile.lokaltuPoints);

  const backHref = isCompareMode
    ? "/homescreen/profile"
    : "/homescreen/profile/friends";

  return (
    <div className="relative min-h-screen bg-white pt-24">
      <div className="absolute top-0 left-0 h-50 w-full bg-[linear-gradient(249.58deg,#61F681_0%,#49BF12_49.21%,#DBC443_97.83%)] pt-8">
        <div className="mb-2 flex items-center gap-2 px-6 pt-6">
          <Link href={backHref}>
            <ChevronLeft className="h-6 w-6 text-[#E3F8D9]" />
          </Link>
          <h1 className="truncate text-2xl font-semibold text-[#E3F8D9]">
            {profile.name}
          </h1>
        </div>
      </div>

      <div className="relative h-full w-full space-y-6 rounded-t-2xl bg-white px-6 pt-8 pb-32">
        {/* Profile header */}
        <div className="flex items-center gap-5 pt-2">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-md">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#E5E7EB]">
                <UserCircle2 className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-xl font-bold tracking-tight text-gray-800">
              {profile.name}
            </span>
            <span className="text-sm text-gray-400">
              Poziom {level.level} · {level.name}
            </span>
            <span className="text-sm font-semibold text-[#49BF12]">
              {profile.lokaltuPoints} pkt
            </span>
          </div>
        </div>

        {/* Friendship action - hidden in compare mode */}
        {!isCompareMode && (
          <FriendshipButton
            userId={profile.id}
            initialStatus={profile.friendStatus}
            initialRequestId={profile.requestId}
          />
        )}

        {isCompareMode && (
          <div className="rounded-2xl border border-[#84cc16]/20 bg-[#f0fce8] p-4 text-center">
            <p className="text-sm font-medium text-[#49BF12]">
              Tryb porównania - przeglądasz profil bez dodawania do znajomych
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">
              {profile.co2Saved.toFixed(1)}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">kg CO₂ zaoszczędzone</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">
              {profile.bagsSaved}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">toreb uratowanych</p>
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Odznaki</h2>

          {profile.earnedBadges.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {profile.earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center overflow-hidden rounded-[2rem] border border-amber-100 bg-white p-6 text-center shadow-sm"
                >
                  <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F9D1]">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-[#D4E84D]/20" />
                    <Trophy className="relative z-10 h-8 w-8 text-[#FCB351]" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">
                    {badge.name}
                  </h3>
                  <p className="mt-1 text-[10px] leading-tight font-medium text-gray-400">
                    {badge.description}
                  </p>
                  <div className="mt-3 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-600">
                    +{badge.points} pkt
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Trophy className="mb-2 h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-400">Brak zdobytych odznak</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
