"use server";

import prisma from "@/lib/prisma";
import { clerkClient, currentUser } from "@clerk/nextjs/server";

export async function getUserDb() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const userDb = await prisma.user.findFirst({
    where: {
      id: user.id,
    },
  });
  return userDb;
}

export async function getUserPublicProfile(targetUserId: string) {
  const me = await currentUser();

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      lokaltuPoints: true,
      co2Saved: true,
      bagsSaved: true,
      challenges: {
        where: { isCompleted: true },
        include: {
          challenge: {
            select: {
              badgeName: true,
              name: true,
              description: true,
              points: true,
            },
          },
        },
      },
    },
  });

  if (!targetUser) return null;

  const earnedBadges = targetUser.challenges
    .filter((cp) => cp.challenge.badgeName)
    .map((cp) => ({
      id: cp.challengeId,
      name: cp.challenge.badgeName!,
      description: cp.challenge.description,
      points: cp.challenge.points,
    }));

  // Guest / own profile — no friendship data needed
  if (!me || me.id === targetUserId) {
    return {
      id: targetUser.id,
      name: targetUser.name,
      avatarUrl: targetUser.avatarUrl,
      lokaltuPoints: targetUser.lokaltuPoints,
      co2Saved: targetUser.co2Saved,
      bagsSaved: targetUser.bagsSaved,
      earnedBadges,
      isMe: me?.id === targetUserId,
      friendStatus: "none" as const,
      requestId: null as string | null,
    };
  }

  const req = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: me.id, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: me.id },
      ],
    },
  });

  let friendStatus: "none" | "sent" | "received" | "friends" = "none";
  let requestId: string | null = null;

  if (req) {
    requestId = req.id;
    if (req.status === "ACCEPTED") {
      friendStatus = "friends";
    } else if (req.status === "PENDING") {
      friendStatus = req.senderId === me.id ? "sent" : "received";
    }
  }

  return {
    id: targetUser.id,
    name: targetUser.name,
    avatarUrl: targetUser.avatarUrl,
    lokaltuPoints: targetUser.lokaltuPoints,
    co2Saved: targetUser.co2Saved,
    bagsSaved: targetUser.bagsSaved,
    earnedBadges,
    isMe: false,
    friendStatus,
    requestId,
  };
}

export async function completeProfile(bagId?: string) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const email = user.emailAddresses[0]?.emailAddress || "";
  const name =
    user.firstName || user.username || email.split("@")[0] || "Użytkownik";
  const avatarUrl = user.imageUrl || "";

  await prisma.user.upsert({
    where: {
      id: user.id,
    },
    update: {
      bagId,
      profileCompleted: true,
      name,
      email,
      avatarUrl,
    },
    create: {
      id: user.id,
      name,
      email,
      avatarUrl,
      bagId,
      profileCompleted: true,
    },
  });
}

export async function updateUserName(name: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Update Prisma
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { name },
  });

  // Update Clerk
  try {
    const client = await clerkClient();
    await client.users.updateUser(user.id, {
      firstName: name,
    });
  } catch (error) {
    console.error("Error updating Clerk user:", error);
    // Even if Clerk update fails, we already updated Prisma
  }

  return updatedUser;
}
