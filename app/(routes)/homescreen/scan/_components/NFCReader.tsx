"use client";

import {
  analyzeReceipt,
  awardPoints,
  checkUserBag,
  verifyBag,
} from "@/app/actions/scan";
import { useCamera } from "@/lib/hooks/use-camera";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { useNfc } from "@/lib/hooks/use-nfc";
import { useCallback, useState } from "react";

import AnalyzingStep from "./steps/analyzing";
import CameraCaptureStep from "./steps/camera-capture";
import ErrorStep from "./steps/error";
import IdleStep from "./steps/idle";
import NfcScanStep from "./steps/nfc-scan";
import NoBagStep from "./steps/no-bag";
import ResultStep from "./steps/result";

type Step =
  | "idle"
  | "scanning_nfc"
  | "camera_ready"
  | "analyzing"
  | "result"
  | "error"
  | "no_bag";

interface ScanResult {
  confidence: number;
  reasoning: string;
  size?: "small" | "medium" | "large";
  pointsData?: {
    points: number;
    bonus: number;
    total: number;
    isNewPlace: boolean;
    placeName?: string;
  };
}

export default function NFCReader() {
  const { startScan } = useNfc();
  const { takePicture } = useCamera();
  const { latitude, longitude } = useGeolocation();

  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setStep("error");
  }, []);

  const handleStart = useCallback(async () => {
    setErrorMsg("");
    setResult(null);

    const { hasBag, error } = await checkUserBag();
    if (error) {
      handleError(error);
      return;
    }

    if (!hasBag) {
      setStep("no_bag");
      return;
    }

    setStep("scanning_nfc");

    try {
      const tag = await startScan(30_000);

      const verify = await verifyBag(tag.content);
      if (!verify.ok) {
        handleError(verify.error ?? "Weryfikacja torby nieudana.");
        return;
      }

      setStep("camera_ready");
    } catch (e) {
      handleError(e instanceof Error ? e.message : "Błąd skanowania NFC.");
    }
  }, [startScan, handleError]);

  const handleTakePhoto = useCallback(async () => {
    try {
      const base64 = await takePicture();
      setStep("analyzing");

      const aiResult = await analyzeReceipt(base64);

      let pointsData;
      if (aiResult.confidence >= 70) {
        pointsData = await awardPoints({
          size: aiResult.size,
          lat: latitude ?? undefined,
          lng: longitude ?? undefined,
        });
      }

      setResult({
        ...aiResult,
        pointsData,
      });
      setStep("result");
    } catch (e) {
      handleError(e instanceof Error ? e.message : "Błąd aparatu lub AI.");
    }
  }, [takePicture, handleError, latitude, longitude]);

  const handleReset = () => {
    setStep("idle");
    setResult(null);
    setErrorMsg("");
  };

  switch (step) {
    case "idle":
      return <IdleStep onStart={handleStart} />;

    case "scanning_nfc":
      return <NfcScanStep />;

    case "camera_ready":
      return <CameraCaptureStep onCapture={handleTakePhoto} />;

    case "analyzing":
      return <AnalyzingStep />;

    case "result":
      return result ? (
        <ResultStep
          confidence={result.confidence}
          reasoning={result.reasoning}
          pointsData={result.pointsData}
          onReset={handleReset}
        />
      ) : (
        <IdleStep onStart={handleStart} />
      );

    case "error":
      return <ErrorStep message={errorMsg} onRetry={handleReset} />;

    case "no_bag":
      return <NoBagStep />;

    default:
      return <IdleStep onStart={handleStart} />;
  }
}
