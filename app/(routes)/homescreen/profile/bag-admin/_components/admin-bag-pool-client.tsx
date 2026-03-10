"use client";

import {
  addBagToPool,
  getAdminBagPool,
  removeBagFromPool,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { useNfc } from "@/lib/hooks/use-nfc";
import { ChevronLeft, Loader2, RefreshCw, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";

type AdminBag = {
  id: string;
  nfcTagId: string;
  assignedAt: Date | string | null;
  user: { id: string; name: string } | null;
};

export default function AdminBagPoolClient() {
  const { startScan, scanning, error } = useNfc();
  const [isPending, startTransition] = useTransition();
  const [bags, setBags] = useState<AdminBag[] | undefined>(undefined);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const refreshBags = useCallback(async () => {
    const data = await getAdminBagPool();
    setBags(data);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshBags();
    }, 0);

    return () => clearTimeout(timer);
  }, [refreshBags]);

  const handleAddByScan = () => {
    setActionError("");
    setActionSuccess("");

    startTransition(async () => {
      try {
        const result = await startScan(60_000);
        await addBagToPool(result.content);
        await refreshBags();
        setActionSuccess("Torba została dodana do puli.");
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setActionError(
          e instanceof Error ? e.message : "Nie udało się dodać torby.",
        );
      }
    });
  };

  const handleDelete = (bagId: string) => {
    setActionError("");
    setActionSuccess("");

    startTransition(async () => {
      try {
        await removeBagFromPool(bagId);
        await refreshBags();
        setActionSuccess("Torba została usunięta z puli.");
      } catch (e) {
        setActionError(
          e instanceof Error ? e.message : "Nie udało się usunąć torby.",
        );
      }
    });
  };

  return (
    <div className="relative min-h-screen bg-white pt-24">
      <div className="absolute top-0 left-0 h-50 w-full bg-[linear-gradient(249.58deg,#61F681_0%,#49BF12_49.21%,#DBC443_97.83%)] pt-8">
        <div className="mb-2 flex items-center gap-2 px-6 pt-6">
          <Link href="/homescreen/profile">
            <ChevronLeft className="h-6 w-6 text-[#E3F8D9]" />
          </Link>
          <h1 className="truncate text-2xl font-semibold text-[#E3F8D9]">
            Pula toreb NFC
          </h1>
        </div>
      </div>

      <div className="relative h-full w-full space-y-4 rounded-t-2xl bg-white px-6 pt-10 pb-32 transition-all">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-bold text-gray-800">Panel administratora</p>
          <p className="mt-1">
            Skanuj kolejne tagi NFC, aby dodawać torby do puli. Mozesz tez usuwac
            torby z listy.
          </p>
        </div>

        {(error || actionError) && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
            {error || actionError}
          </div>
        )}

        {actionSuccess && (
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-700">
            {actionSuccess}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleAddByScan}
            disabled={scanning || isPending}
            className="h-14 w-full rounded-2xl bg-[#84cc16] text-base font-bold text-white"
          >
            {scanning || isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Skanowanie...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                Skanuj i dodaj
              </>
            )}
          </Button>

          <Button
            onClick={() => startTransition(() => void refreshBags())}
            disabled={isPending || scanning}
            className="h-14 w-full rounded-2xl border-2 border-[#84cc16]/20 bg-white text-base font-bold text-[#49BF12] hover:bg-[#f0fce8]"
          >
            <RefreshCw className="h-5 w-5" />
            Odswiez
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-700">Dostepne torby</p>
          {bags === undefined ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
              Ladowanie listy toreb...
            </div>
          ) : bags.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
              Brak toreb w puli.
            </div>
          ) : (
            <div className="space-y-2">
              {bags.map((bag) => (
                <div
                  key={bag.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-800">
                      {bag.nfcTagId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {bag.user
                        ? `Przypisana do: ${bag.user.name}`
                        : "Nieprzypisana"}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(bag.id)}
                    disabled={isPending}
                    className="h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Usun
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
