"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { scanUrl } from "@/lib/chimera-api";
import type { ScanEvaluation } from "@/lib/scan-engine";
import {
  TIMELINE_LOGS,
  TOTAL_SCAN_MS,
  type ScanStatus,
  type TerminalLog,
} from "@/lib/scan-timeline";

export type { ScanStatus };

export type DashboardTab = "quick" | "deep" | "map";

export function useScanSession() {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScanEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>("quick");
  const [progress, setProgress] = useState(0);
  const timersRef = useRef<number[]>([]);
  const logIdRef = useRef(0);
  const scanningRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const isBusy = status === "connecting" || status === "analyzing";

  const runScan = useCallback(
    (inputUrl: string) => {
      const trimmed = inputUrl.trim();
      if (!trimmed || scanningRef.current) return;

      scanningRef.current = true;
      clearTimers();
      setUrl(trimmed);
      setResult(null);
      setError(null);
      setLogs([]);
      setProgress(0);
      setActiveTab("quick");
      setStatus("connecting");

      const start = performance.now();

      TIMELINE_LOGS.forEach((entry) => {
        const timerId = window.setTimeout(() => {
          if (entry.phase === "connecting") setStatus("connecting");
          if (entry.phase === "analyzing") setStatus("analyzing");

          setLogs((prev) => [
            ...prev,
            {
              ...entry,
              id: `log-${++logIdRef.current}`,
            },
          ]);
        }, entry.at);
        timersRef.current.push(timerId);
      });

      const MAX_PROGRESS_DURATION = 10000;
      const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 2.2);
      const progressTimer = window.setInterval(() => {
        const elapsed = performance.now() - start;
        const normalized = Math.min(1, Math.max(0, elapsed / MAX_PROGRESS_DURATION));
        setProgress(Math.min(99, Math.round(ease(normalized) * 100)));
      }, 50);
      timersRef.current.push(progressTimer as unknown as number);

      const finishScan = (evaluation: ScanEvaluation | null, scanError: string | null) => {
        clearTimers();
        window.clearInterval(progressTimer);
        scanningRef.current = false;

        if (scanError) {
          setError(scanError);
          setStatus("idle");
          setProgress(0);
          setLogs((prev) => [
            ...prev,
            {
              id: `log-${++logIdRef.current}`,
              at: Math.round(performance.now() - start),
              phase: "done",
              message: `Error: ${scanError}`,
            },
          ]);
          return;
        }

        if (evaluation) {
          setResult(evaluation);
          setStatus("done");
          setProgress(100);
          setLogs((prev) => [
            ...prev,
            {
              id: `log-${++logIdRef.current}`,
              at: Math.round(performance.now() - start),
              phase: "done",
              message: `${Math.round(performance.now() - start)}ms: Verdict — ${evaluation.headline}`,
            },
          ]);
        }
      };

      scanUrl(trimmed)
        .then((evaluation) => finishScan(evaluation, null))
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "Scan failed";
          finishScan(null, message);
        });
    },
    [clearTimers, setUrl]
  );

  const reset = useCallback(() => {
    clearTimers();
    scanningRef.current = false;
    setStatus("idle");
    setResult(null);
    setError(null);
    setLogs([]);
    setProgress(0);
  }, [clearTimers]);

  const phaseLabel = useMemo(() => {
    switch (status) {
      case "connecting":
        return "Connecting to threat engine";
      case "analyzing":
        return "Deep analysis in progress";
      case "done":
        return "Scan complete";
      default:
        return error ? "Scan failed" : "Awaiting target URL";
    }
  }, [status, error]);

  return {
    status,
    url,
    setUrl,
    result,
    error,
    logs,
    activeTab,
    setActiveTab,
    progress,
    phaseLabel,
    runScan,
    reset,
    isBusy,
  };
}

export type ScanSession = ReturnType<typeof useScanSession>;
