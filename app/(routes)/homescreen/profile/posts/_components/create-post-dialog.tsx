"use client";

import { createPost } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CreatePostDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    startTransition(async () => {
      try {
        await createPost(content);
        setOpen(false);
        setContent("");
        router.refresh();
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Błąd podczas tworzenia postu.",
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <button className="bg-main flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95">
            <Plus className="h-7 w-7 text-white" strokeWidth={3} />
          </button>
        )}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90dvh] overflow-hidden rounded-[2.5rem]! border-none p-0 shadow-2xl sm:max-w-110"
      >
        <div className="scrollbar-none flex h-full max-h-[90dvh] flex-col overflow-y-auto pb-4">
          <div className="px-8 pt-8 pb-4">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-3xl font-bold tracking-tight text-neutral-900">
                Nowy post
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed font-medium text-neutral-500">
                Podziel się swoimi myślami lub nowinkami z innymi użytkownikami.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="post-content"
                  className="ml-1 text-sm font-bold tracking-widest text-neutral-700 uppercase"
                >
                  Treść postu
                </Label>
                <Textarea
                  id="post-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Opisz, co ciekawego się u Ciebie dzieje..."
                  className="min-h-37.5 resize-none rounded-2xl border-neutral-100 bg-neutral-50/50 p-4 focus-visible:ring-[#44d021]"
                  required
                />
              </div>

              <div className="pt-4 pb-4">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="tile"
                    onClick={() => setOpen(false)}
                    className="h-14 flex-1"
                  >
                    Anuluj
                  </Button>
                  <Button
                    disabled={isPending}
                    type="submit"
                    variant="premium"
                    className="flex-1"
                  >
                    {isPending ? "Publikowanie..." : "Opublikuj"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
