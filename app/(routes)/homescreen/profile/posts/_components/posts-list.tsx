"use client";

import { deleteMyPost } from "@/app/actions/posts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { FileText, MessageSquare, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CommentsSheet } from "../../../_components/comments-sheet";
import { CreatePostDialog } from "./create-post-dialog";

interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  _count: {
    comments: number;
  };
}

export function MyPostsList({
  posts,
  currentUserId,
  isAdmin = false,
}: {
  posts: Post[];
  currentUserId: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openPostId, setOpenPostId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Czy na pewno chcesz usunąć ten post?")) return;

    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteMyPost(id);
        router.refresh();
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Wystąpił błąd podczas usuwania.",
        );
      } finally {
        setDeletingId(null);
      }
    });
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-50 text-gray-200">
          <FileText className="h-12 w-12" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Brak postów</h2>
        <p className="mt-2 text-sm font-medium text-gray-500">
          Nie dodałeś jeszcze żadnych postów na tablicę.
        </p>
        <div className="mt-8">
          <CreatePostDialog>
            <button className="h-12 rounded-2xl bg-[linear-gradient(249.58deg,#61F681_0%,#49BF12_49.21%,#DBC443_97.83%)] px-8 font-bold text-white shadow-lg transition-all active:scale-95">
              Dodaj swój pierwszy post
            </button>
          </CreatePostDialog>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      {posts.map((post) => (
        <div
          key={post.id}
          className="group relative flex flex-col gap-4 overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-tight text-[#84cc16] uppercase">
                {format(new Date(post.createdAt), "d MMMM yyyy", {
                  locale: pl,
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDelete(post.id)}
                disabled={isPending && deletingId === post.id}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500 transition-all hover:bg-red-500 hover:text-white active:scale-95 disabled:opacity-50"
              >
                <Trash2
                  className={cn(
                    "h-5 w-5",
                    isPending && deletingId === post.id && "animate-pulse",
                  )}
                />
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-gray-50/50 p-5">
            <p className="text-sm leading-relaxed font-medium text-gray-600">
              {post.content}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-gray-50 px-1 pt-4">
            <div className="flex items-center gap-1.5 text-gray-400">
              <MessageSquare className="h-4 w-4 fill-gray-100 text-gray-300" />
              <span className="text-xs font-bold">
                {post._count.comments} komentarzy
              </span>
            </div>

            <button
              onClick={() => setOpenPostId(post.id)}
              className="flex items-center gap-1.5 rounded-full bg-[#49BF12]/5 px-4 py-2 text-[11px] font-black tracking-tight text-[#49BF12] uppercase transition-all hover:bg-[#49BF12]/10 active:scale-95"
            >
              Podejrzyj komentarze
            </button>
          </div>
        </div>
      ))}

      {openPostId !== null && (
        <CommentsSheet
          postId={openPostId}
          commentCount={
            posts.find((p) => p.id === openPostId)?._count.comments ?? 0
          }
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          open={true}
          onOpenChange={(open: boolean) => {
            if (!open) setOpenPostId(null);
          }}
        />
      )}
    </div>
  );
}
