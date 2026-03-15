"use server";

import { currentUser } from "@clerk/nextjs/server";

import {
  PostDefaultArgs,
  PostGetPayload,
} from "@/generated/prisma/models/Post";
import prisma from "@/lib/prisma";

export type PostWithAuthor = PostGetPayload<typeof postWithAuthor>;

const postWithAuthor = {
  include: {
    author: {
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    },
    _count: {
      select: {
        comments: true,
      },
    },
  },
} satisfies PostDefaultArgs;

export async function getPosts(
  page: number = 1,
  limit: number = 10,
): Promise<{
  posts: PostWithAuthor[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}> {
  const skip = (page - 1) * limit;

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      ...postWithAuthor,
    }),
    prisma.post.count(),
  ]);

  return {
    posts,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    totalCount,
  };
}
export async function getUserPosts() {
  const user = await currentUser();
  if (!user) return [];

  return prisma.post.findMany({
    where: {
      authorId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });
}

export async function deleteMyPost(id: number) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post || post.authorId !== user.id) {
    throw new Error("Nie masz uprawnień do usunięcia tego postu.");
  }

  return prisma.post.delete({
    where: { id },
  });
}

export async function createPost(content: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const title =
    content.slice(0, 50).trim() + (content.length > 50 ? "..." : "");

  return prisma.post.create({
    data: {
      title,
      content,
      allowed: true,
      authorId: user.id,
    },
  });
}
