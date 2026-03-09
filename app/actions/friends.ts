"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getAuthUser() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

// ─── Search ─────────────────────────────────────────────────────────────────

export async function searchUsers(query: string) {
  const user = await getAuthUser();

  if (!query.trim()) return [];

  // Find all existing relationships so we can tag results with status
  const existingRequests = await prisma.friendRequest.findMany({
    where: {
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    },
  });

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: user.id } },
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      lokaltuPoints: true,
    },
    take: 20,
  });

  return users.map((u) => {
    const req = existingRequests.find(
      (r) =>
        (r.senderId === user.id && r.receiverId === u.id) ||
        (r.senderId === u.id && r.receiverId === user.id),
    );

    let status: "none" | "sent" | "received" | "friends" = "none";
    if (req) {
      if (req.status === "ACCEPTED") {
        status = "friends";
      } else if (req.status === "PENDING") {
        status = req.senderId === user.id ? "sent" : "received";
      }
    }

    return { ...u, friendStatus: status, requestId: req?.id ?? null };
  });
}

// ─── Send / Cancel request ───────────────────────────────────────────────────

export async function sendFriendRequest(receiverId: string) {
  const user = await getAuthUser();

  if (user.id === receiverId) throw new Error("Cannot add yourself");

  // Check if a request already exists in either direction
  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: user.id, receiverId },
        { senderId: receiverId, receiverId: user.id },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") return; // already friends, no-op

    if (existing.status === "PENDING") {
      // They already sent ME a request → auto-accept (mutual interest)
      if (existing.senderId === receiverId && existing.receiverId === user.id) {
        await prisma.friendRequest.update({
          where: { id: existing.id },
          data: { status: "ACCEPTED" },
        });
        const me = await prisma.user.findUnique({
          where: { id: user.id },
          select: { name: true },
        });
        await prisma.notification.create({
          data: {
            userId: receiverId,
            title: "Zaproszenie zaakceptowane",
            message: `${me?.name ?? "Ktoś"} zaakceptował(a) Twoje zaproszenie do znajomych!`,
          },
        });
        revalidatePath("/homescreen/profile/friends");
        return;
      }
      // I already sent them a request → silently ignore (no client error)
      return;
    }

    // REJECTED — allow re-sending by updating status back to PENDING
    if (existing.status === "REJECTED") {
      await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { status: "PENDING", senderId: user.id, receiverId },
      });
      revalidatePath("/homescreen/profile/friends");
      return;
    }
  }

  const sender = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  });

  await prisma.friendRequest.create({
    data: { senderId: user.id, receiverId },
  });

  // Notify the receiver
  await prisma.notification.create({
    data: {
      userId: receiverId,
      title: "Nowe zaproszenie do znajomych",
      message: `${sender?.name ?? "Ktoś"} wysłał(a) Ci zaproszenie do znajomych.`,
    },
  });

  revalidatePath("/homescreen/profile/friends");
}

export async function cancelFriendRequest(requestId: string) {
  const user = await getAuthUser();

  const req = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!req || req.senderId !== user.id)
    throw new Error("Request not found or unauthorized");

  await prisma.friendRequest.delete({ where: { id: requestId } });
  revalidatePath("/homescreen/profile/friends");
}

// ─── Accept / Reject request ─────────────────────────────────────────────────

export async function acceptFriendRequest(requestId: string) {
  const user = await getAuthUser();

  const req = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: { select: { name: true } },
    },
  });

  if (!req || req.receiverId !== user.id)
    throw new Error("Request not found or unauthorized");

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "ACCEPTED" },
  });

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  });

  // Notify the sender
  await prisma.notification.create({
    data: {
      userId: req.senderId,
      title: "Zaproszenie zaakceptowane",
      message: `${me?.name ?? "Ktoś"} zaakceptował(a) Twoje zaproszenie do znajomych!`,
    },
  });

  revalidatePath("/homescreen/profile/friends");
}

export async function rejectFriendRequest(requestId: string) {
  const user = await getAuthUser();

  const req = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!req || req.receiverId !== user.id)
    throw new Error("Request not found or unauthorized");

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/homescreen/profile/friends");
}

// ─── Remove friend ────────────────────────────────────────────────────────────

export async function removeFriend(friendId: string) {
  const user = await getAuthUser();

  await prisma.friendRequest.deleteMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: user.id, receiverId: friendId },
        { senderId: friendId, receiverId: user.id },
      ],
    },
  });

  revalidatePath("/homescreen/profile/friends");
}

// ─── Getters ──────────────────────────────────────────────────────────────────

export async function getMyFriends() {
  const user = await getAuthUser();

  const accepted = await prisma.friendRequest.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          lokaltuPoints: true,
          co2Saved: true,
          bagsSaved: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          lokaltuPoints: true,
          co2Saved: true,
          bagsSaved: true,
        },
      },
    },
  });

  return accepted.map((req) => ({
    requestId: req.id,
    friend: req.senderId === user.id ? req.receiver : req.sender,
  }));
}

export async function getReceivedRequests() {
  const user = await getAuthUser();

  return prisma.friendRequest.findMany({
    where: {
      receiverId: user.id,
      status: "PENDING",
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          lokaltuPoints: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSentRequests() {
  const user = await getAuthUser();

  return prisma.friendRequest.findMany({
    where: {
      senderId: user.id,
      status: "PENDING",
    },
    include: {
      receiver: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFriendshipStatus(targetUserId: string) {
  const user = await getAuthUser();

  const req = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: user.id, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: user.id },
      ],
    },
  });

  if (!req) return { status: "none" as const, requestId: null };

  if (req.status === "ACCEPTED")
    return { status: "friends" as const, requestId: req.id };
  if (req.status === "PENDING") {
    return {
      status: (req.senderId === user.id ? "sent" : "received") as
        | "sent"
        | "received",
      requestId: req.id,
    };
  }
  return { status: "none" as const, requestId: null };
}
