"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Bot, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { themeTokens } from "@/lib/themes";
import { APPLE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { EmailEvaluation } from "@/lib/email-engine";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { runAgenticScan } from "@/lib/chimera-api";
import type { AgenticScanResult } from "@/lib/chimera-api";
import { AgenticRunOutput } from "@/components/workbench/WorkbenchRunOutput";

export function EmailResults({
  result,
  onReset,
  emailInput,
}: {
  result: EmailEvaluation;
  onReset: () => void;
  emailInput: string;
}) {
  const { theme } = useTheme();
  const t = themeTokens[theme];
  const isDark = theme === "dark";
  const bad = result.verdict === "malicious";
  const [pending, setPending] = useState(false);
  const [agenticResult, setAgenticResult] = useState<AgenticScanResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runInlineAgentic = async () => {
    const target = emailInput.trim();
    if (!target || pending) return;

    setPending(true);
    setActionError(null);

    try {
      const next = await runAgenticScan({
        url: "",
        sender: "",
        email_body: target,
      });
      setAgenticResult(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Agentic request failed";
      setActionError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: APPLE_EASE }}
      className={cn(
        "rounded-3xl border p-8",
        t.glass,
        bad
          ? isDark
            ? "border-red-500/20"
            : "border-red-200"
          : isDark
            ? "border-emerald-500/15"
            : "border-emerald-200/80"
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {bad ? (
            <AlertTriangle className="h-10 w-10 text-red-400/90" strokeWidth={1.25} />
          ) : (
            <CheckCircle2 className="h-10 w-10 text-emerald-400/90" strokeWidth={1.25} />
          )}
          <div>
            <p className={cn("text-[10px] font-semibold uppercase tracking-[0.3em]", t.muted)}>
              Email verdict
            </p>
            <h3 className={cn("mt-1 text-2xl font-light tracking-tight", t.text)}>
              {result.headline}
            </h3>
            <p className={cn("mt-2 max-w-lg text-sm leading-relaxed", t.muted)}>{result.summary}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-4xl font-light tabular-nums", bad ? "text-red-400/90" : t.accent)}>
            {result.safetyScore}
          </p>
          <p className={cn("text-xs uppercase tracking-widest", t.muted)}>Safety</p>
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

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <MagneticButton themeMode={theme} variant="ghost" onClick={onReset}>
          Check another email
        </MagneticButton>
        <MagneticButton themeMode={theme} variant="ghost" onClick={runInlineAgentic} disabled={pending}>
          <Bot className="h-4 w-4" />
          {pending ? "Running…" : "Agentic Run"}
        </MagneticButton>
      </div>

      {pending && (
        <div className={cn("mt-4 rounded-2xl border px-4 py-3 text-sm", t.panel, t.muted)}>
          Running agentic analysis on the scanned email…
        </div>
      )}

      {actionError && (
        <div className={cn("mt-4 rounded-2xl border px-4 py-3 text-sm", t.panel, isDark ? "border-red-500/20 text-red-300" : "border-red-200 text-red-700")}>
          {actionError}
        </div>
      )}

      {agenticResult && (
        <div className="mt-4">
          <AgenticRunOutput result={agenticResult} />
        </div>
      )}
    </motion.article>
  );
}
