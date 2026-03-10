"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { checkChallenges } from "./challenges";

/**
 * Verifies that the scanned NFC tag belongs to the current user.
 * Returns true if matched, false if not linked to this user.
 */
export async function verifyBag(
  tagId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Nie zalogowany." };

  const normalizedTag = tagId.toLowerCase().trim();

  const userDb = await prisma.user.findUnique({
    where: { id: user.id },
    include: { bag: true },
  });
  if (!userDb) return { ok: false, error: "Nie znaleziono konta." };
  if (!userDb.bagId || !userDb.bag) {
    return { ok: false, error: "Brak przypisanej torby." };
  }

  if (userDb.bag.nfcTagId.toLowerCase().trim() !== normalizedTag) {
    return { ok: false, error: "To nie jest Twoja torba." };
  }

  if (userDb.bag.userId !== user.id) {
    return { ok: false, error: "Ta torba nie jest przypisana do Ciebie." };
  }

  return { ok: true };
}

/**
 * Checks if the current user has a bagId assigned.
 */
export async function checkUserBag(): Promise<{
  hasBag: boolean;
  error?: string;
}> {
  try {
    const user = await currentUser();
    if (!user) return { hasBag: false };

    const userDb = await prisma.user.findUnique({ where: { id: user.id } });
    if (!userDb) return { hasBag: false };

    const normalizedBagId = userDb.bagId?.trim().toLowerCase();

    const bag = await prisma.bag.findFirst({
      where: {
        OR: [
          { userId: user.id },
          ...(normalizedBagId ? [{ nfcTagId: normalizedBagId }] : []),
        ],
      },
    });

    return { hasBag: !!bag };
  } catch {
    return {
      hasBag: false,
      error: "Nie udało się sprawdzić przypisanej torby. Spróbuj ponownie.",
    };
  }
}

/**
 * Sends a base64 image to OpenRouter AI and returns how confident the AI is
 * that the photo shows fresh (just-done) grocery shopping, along with the size of the purchase.
 */
export async function analyzeReceipt(imageBase64: string): Promise<{
  confidence: number; // 0-100
  reasoning: string;
  size: "small" | "medium" | "large";
}> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey)
    throw new Error("Brak klucza API OpenRouter (OPENROUTER_API_KEY).");

  const body = {
    model: "google/gemini-2.0-flash-001",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Jesteś surowym ekspertem ds. wykrywania oszustw w procesie weryfikacji zakupów spożywczych. Twoim zadaniem jest bezlitosna ocena, czy zdjęcie PRZEDSTAWIA PRAWDZIWE, ŚWIEŻO ZROBIONE ZAKUPY SPOŻYWCZE.

BĄDŹ EKSTREMALNIE SCEPTYCZNY. Jeśli masz choć cień wątpliwości, obniż ocenę confidence poniżej 50.

KRYTERIA ODRZUCENIA (Confidence < 30%):
- Zdjęcie przedstawia przedmioty codziennego użytku NIEBĘDĄCE jedzeniem (elektronika, ubrania, kosmetyki, narzędzia).
- Zdjęcie jest zrzutem ekranu, zdjęciem innego ekranu lub starą fotografią.
- Zdjęcie jest rozmazane, nieczytelne lub przedstawia losowe przedmioty.
- Scena wygląda na ustawioną (np. jeden owoc na środku dywanu).

KRYTERIA AKCEPTACJI (Confidence > 70%):
- Wyraźnie widoczne produkty spożywcze: owoce, warzywa, pieczywo, nabiał, napoje w opakowaniach handlowych.
- Produkty znajdują się w torbie zakupowej lub typowym otoczeniu (kuchnia, blat, sklep).

ROZMIAR ZAKUPÓW (size):
1. Small: 1-2 produkty (np. chleb i mleko).
2. Medium: 3-5 produktów lub połowa torby.
3. Large: Pełna torba, obfite zakupy.

Odpowiedz WYŁĄCZNIE w formacie JSON:
{
  "confidence": <liczba 0-100>,
  "size": "small" | "medium" | "large",
  "reasoning": "<jedno zdanie po polsku uzasadniające surowy werdykt>"
}`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
  };

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://lokaltu.pl",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${text}`);
  }

  const json = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  const raw = json.choices[0]?.message?.content ?? "";

  // Extract JSON from the response (model may add markdown fences)
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Nieprawidłowa odpowiedź AI.");

  const parsed = JSON.parse(match[0]) as {
    confidence: number;
    reasoning: string;
    size: "small" | "medium" | "large";
  };
  return {
    confidence: parsed.confidence,
    reasoning: parsed.reasoning,
    size: parsed.size || "small",
  };
}

/**
 * Awards points to the user based on the purchase size and first-time visit bonus.
 */
export async function awardPoints(data: {
  size: "small" | "medium" | "large";
  lat?: number;
  lng?: number;
}): Promise<{
  points: number;
  bonus: number;
  total: number;
  isNewPlace: boolean;
  placeName?: string;
  co2Saved: number;
  bagsSaved: number;
}> {
  const user = await currentUser();
  if (!user) throw new Error("Nie zalogowany.");

  const pointsMap = {
    small: 15,
    medium: 30,
    large: 50,
  };

  const basePoints = pointsMap[data.size];
  let bonus = 0;
  let isNewPlace = false;
  let closestPlaceId: string | null = null;
  let placeName: string | undefined = undefined;

  // 1. Find the closest place if coordinates are provided
  if (data.lat && data.lng) {
    // Find places within ~500m (roughly 0.005 degrees)
    const places = await prisma.place.findMany({
      where: {
        latitude: { gte: data.lat - 0.005, lte: data.lat + 0.005 },
        longitude: { gte: data.lng - 0.005, lte: data.lng + 0.005 },
      },
    });

    if (places.length > 0) {
      // Find the absolute closest one
      const sorted = places.sort((a, b) => {
        const distA = Math.hypot(
          a.latitude - data.lat!,
          a.longitude - data.lng!,
        );
        const distB = Math.hypot(
          b.latitude - data.lat!,
          b.longitude - data.lng!,
        );
        return distA - distB;
      });

      closestPlaceId = sorted[0].id;
      placeName = sorted[0].name;

      // 2. Check if user shopped here before
      const previousPurchase = await prisma.purchase.findFirst({
        where: {
          userId: user.id,
          placeId: closestPlaceId,
        },
      });

      if (!previousPurchase) {
        bonus = 10;
        isNewPlace = true;
      }
    }
  }

  const totalPoints = basePoints + bonus;
  const co2Amount = 0.8; // Standard 0.8kg per visit
  const bagsSavedValue = data.size === "small" ? 1 : 2; // 1 for small, 2 for med/large

  // 3. Perform atomic update
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        lokaltuPoints: { increment: totalPoints },
        co2Saved: { increment: co2Amount },
        bagsSaved: { increment: bagsSavedValue },
      },
    }),
    prisma.purchase.create({
      data: {
        userId: user.id,
        placeId: closestPlaceId,
        points: totalPoints,
        size: data.size,
        co2Saved: co2Amount,
        bagsSaved: bagsSavedValue,
      },
    }),
  ]);

  // Handle challenges
  await checkChallenges(user.id);

  revalidatePath("/(routes)/homescreen", "layout");

  return {
    points: basePoints,
    bonus,
    total: totalPoints,
    isNewPlace: isNewPlace,
    placeName: placeName,
    co2Saved: co2Amount,
    bagsSaved: bagsSavedValue,
  };
}
