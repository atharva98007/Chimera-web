"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, Bot, Box, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { themeTokens } from "@/lib/themes";
import { APPLE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ScanEvaluation } from "@/lib/scan-engine";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { runAgenticScan, runSandboxScan } from "@/lib/chimera-api";
import type { AgenticScanResult, SandboxScanResult } from "@/lib/chimera-api";
import { AgenticRunOutput, SandboxRunOutput } from "@/components/workbench/WorkbenchRunOutput";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: APPLE_EASE } },
};

export function ScanResults({
  result,
  onScanAnother,
}: {
  result: ScanEvaluation;
  onScanAnother: () => void;
}) {
  const { theme } = useTheme();
  const t = themeTokens[theme];
  const isDark = theme === "dark";
  const bad = result.verdict === "malicious";
  const caution = result.riskClass === "warning";
  const [action, setAction] = useState<"agentic" | "sandbox" | null>(null);
  const [pending, setPending] = useState(false);
  const [agenticResult, setAgenticResult] = useState<AgenticScanResult | null>(null);
  const [sandboxResult, setSandboxResult] = useState<SandboxScanResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runInlineAction = async (mode: "agentic" | "sandbox") => {
    const target = result.scannedUrl.trim();
    if (!target || pending) return;

    setAction(mode);
    setPending(true);
    setActionError(null);

    try {
      if (mode === "agentic") {
        const next = await runAgenticScan(target);
        setAgenticResult(next);
        setSandboxResult(null);
      } else {
        const next = await runSandboxScan(target);
        setSandboxResult(next);
        setAgenticResult(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setActionError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.article
        variants={item}
        className={cn(
          "rounded-3xl border p-8",
          t.glass,
          bad
            ? isDark
              ? "border-red-500/15"
              : "border-red-200/80"
            : caution
              ? isDark
                ? "border-amber-500/15"
                : "border-amber-200/80"
              : isDark
                ? "border-emerald-500/10"
                : "border-emerald-200/60"
        )}
      >
        <div
          className={cn(
            "mt-0 grid grid-cols-4 items-center gap-1.5 rounded-full border px-1.5 py-1.5",
            isDark
              ? "border-white/10 bg-white/5"
              : "border-black/5 bg-white"
          )}
        >
          <MagneticButton
            onClick={() => runInlineAction("agentic")}
            disabled={pending}
            className={cn(
              "w-full min-w-[138px] rounded-full px-3 py-2 text-xs font-semibold tracking-wide",
              isDark
                ? "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15"
                : "bg-white/80 text-zinc-900 ring-1 ring-black/10 hover:bg-white"
            )}
          >
            <Bot className="h-3.5 w-3.5" />
            Agentic Run
          </MagneticButton>

          <MagneticButton
            onClick={() => runInlineAction("sandbox")}
            disabled={pending}
            className={cn(
              "w-full min-w-[116px] rounded-full px-3 py-2 text-xs font-semibold tracking-wide",
              isDark
                ? "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15"
                : "bg-white/80 text-zinc-900 ring-1 ring-black/10 hover:bg-white"
            )}
          >
            <Box className="h-3.5 w-3.5" />
            Sandbox
          </MagneticButton>

          <MagneticButton
            variant="ghost"
            onClick={onScanAnother}
            className={cn(
              "w-full rounded-full px-3 py-2 text-xs font-semibold tracking-wide",
              isDark
                ? "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15"
                : "bg-white/80 text-zinc-900 ring-1 ring-black/10 hover:bg-white"
            )}
          >
            Scan another URL
          </MagneticButton>

          <Link href="/features" className="inline-flex w-full">
            <MagneticButton
              variant="ghost"
              className={cn(
                "w-full rounded-full px-3 py-2 text-xs font-semibold tracking-wide",
                isDark
                  ? "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15"
                  : "bg-white/80 text-zinc-900 ring-1 ring-black/10 hover:bg-white"
              )}
            >
              Security Checks
            </MagneticButton>
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div className="flex gap-4">
            {bad ? (
              <AlertTriangle className="h-9 w-9 text-red-400/80" strokeWidth={1.25} />
            ) : caution ? (
              <AlertTriangle className="h-9 w-9 text-amber-400/80" strokeWidth={1.25} />
            ) : (
              <CheckCircle2 className="h-9 w-9 text-emerald-400/80" strokeWidth={1.25} />
            )}
            <div>
              <p className={cn("text-[10px] font-semibold uppercase tracking-[0.3em]", t.muted)}>
                Verdict
              </p>
              <h2 className={cn("mt-1 text-2xl font-light tracking-tight", t.text)}>
                {result.headline}
              </h2>
              <p className={cn("mt-2 max-w-lg text-sm leading-relaxed", t.muted)}>
                {result.summary}
              </p>
              {result.latencyMs != null && (
                <p className={cn("mt-2 text-xs", t.muted)}>
                  Analysis completed in {Math.round(result.latencyMs)}ms · Risk score {result.riskScore}%
                </p>
              )}
            </div>
          </div>
        </div>
        {result.flags.length > 0 && (
          <ul className="mt-6 space-y-2 border-t border-white/[0.06] pt-6">
            {result.flags.map((f) => (
              <li key={f} className={cn("text-sm", isDark ? "text-red-300/80" : "text-red-700")}>
                {f}
              </li>
            ))}
          </ul>
        )}

        {pending && (
          <div className={cn("mt-4 rounded-2xl border px-4 py-3 text-sm", t.panel, t.muted)}>
            {action === "agentic" ? "Running agentic analysis…" : "Running sandbox detonation…"}
          </div>
        )}

        {actionError && (
          <div className={cn("mt-4 rounded-2xl border px-4 py-3 text-sm", t.panel, isDark ? "border-red-500/20 text-red-300" : "border-red-200 text-red-700")}>
            {actionError}
          </div>
        )}

        {action === "sandbox" && sandboxResult && (
          <div className="mt-4">
            <SandboxRunOutput result={sandboxResult} />
          </div>
        )}

        {action === "agentic" && agenticResult && (
          <div className="mt-4">
            <AgenticRunOutput result={agenticResult} />
          </div>
        )}
      </motion.article>
    </motion.div>
  );
}
