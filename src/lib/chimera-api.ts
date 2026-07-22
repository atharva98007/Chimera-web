import {
  AGENTIC_ENDPOINT,
  EMAIL_SCAN_ENDPOINT,
  SANDBOX_ENDPOINT,
  URL_SCAN_ENDPOINT,
} from "@/lib/api-config";
import type { EmailEvaluation } from "@/lib/email-engine";
import type { ScanEvaluation, ScanRiskClass } from "@/lib/scan-engine";

type FeatureDetail = { score?: number; message?: string };

type UnifiedScanResponse = {
  composite_score?: number;
  latency_ms?: number;
  layer_scores?: Record<string, number | null>;
  details?: Record<string, FeatureDetail | undefined>;
};

type EmailScanResponse = {
  risk_score?: number;
  verdict?: string;
  label?: string;
  confidence?: number | null;
  details?: Record<string, string>;
};

type AgenticResponse = {
  target_url?: string;
  consensus_reached?: boolean;
  latency_ms?: number;
  sub_agent_claims?: Record<
    string,
    { claim?: string; confidence?: number; evidence?: string[] }
  >;
  final_evaluation?: {
    final_verdict?: string;
    verdict?: string;
    risk_score?: number;
    verdict_justification?: string;
    justification?: string;
    confidence_score?: number;
  };
};

type SandboxResponse = {
  verdict?: string;
  confidence?: number;
  indicators?: string[];
  source?: string;
  raw?: {
    page_title?: string;
    total_network_connections?: number;
    error?: string;
  };
};

export type SandboxVerdict = "clean" | "suspicious" | "malicious" | "unknown";

export type SandboxScanResult = {
  url: string;
  verdict: SandboxVerdict;
  confidence: number;
  pageTitle?: string;
  networkConnections?: number;
  indicators: string[];
  note?: string;
};

export type AgenticScanResult = {
  targetUrl: string;
  consensusReached: boolean;
  latencyMs?: number;
  finalVerdict: string;
  justification?: string;
  agents: { name: string; claim: string; confidence: number }[];
};

// Added custom timeout tracking (defaulting to 15s to allow slower backend layers like v2 to resolve)
async function postJson<T>(url: string, body: unknown, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const err = (await res.json()) as { detail?: unknown };
        detail =
          typeof err.detail === "string"
            ? err.detail
            : JSON.stringify(err.detail ?? err);
      } catch {
        /* ignore parse errors */
      }
      throw new Error(detail || `Request failed (${res.status})`);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function riskFromScore(riskScore: number): {
  riskClass: ScanRiskClass;
  riskLevel: string;
  headline: string;
} {
  if (riskScore > 75) {
    return {
      riskClass: "danger",
      riskLevel: "Phishing",
      headline: "Malicious / Phishing Detected",
    };
  }
  if (riskScore >= 50) {
    return {
      riskClass: "warning",
      riskLevel: "Suspicious",
      headline: "Suspicious URL Detected",
    };
  }
  return {
    riskClass: "safe",
    riskLevel: "Safe / Verified",
    headline: "Safe / Verified",
  };
}

function normalizeDetailScore(key: string, score: number): number {
  if (!Number.isFinite(score)) return 0;

  const normalized = score > 1 ? Math.max(0, Math.min(1, score / 100)) : Math.max(0, Math.min(1, score));

  const invertedKeys = new Set([
    "url_structure_analysis",
    "xgboost_analysis",
    "layer_4_sandbox",
  ]);

  if (invertedKeys.has(key)) {
    return 1 - normalized;
  }

  return normalized;
}

function layerState(value: number | null | undefined): "pass" | "warn" | "fail" {
  if (value == null) return "pass";
  if (value > 0.5) return "fail"; // High score (>0.5) implies high risk/phishing
  if (value > 0.2) return "warn";
  return "pass";
}

function normalizeResponseKeys(response: UnifiedScanResponse): UnifiedScanResponse {
  const keyMap: Record<string, string> = {
    // v1/v2/v4 alias normalization
    analyze: "layer_2_network",
    analyse: "layer_2_network",
    analysis: "layer_2_network",
    xgboost: "xgboost_analysis",
    xgboost_analysis: "xgboost_analysis",
    url_structure: "url_structure_analysis",
    urlstructure: "url_structure_analysis",
    url_structure_analysis: "url_structure_analysis",
    cnn_visual: "cnn_visual_analysis",
    cnnvisual: "cnn_visual_analysis",
    cnn_visual_analysis: "cnn_visual_analysis",
    vision_analysis: "cnn_visual_analysis",
    favicon_mismatch: "favicon_mismatch",
    sandbox_behavior: "layer_4_sandbox",
    layer_4: "layer_4_sandbox",
    layer_4_sandbox: "layer_4_sandbox",
    layer_2_network: "layer_2_network",
    network_topology: "layer_2_network",
    threat_intelligence: "threat_intelligence",
    layer_5_context: "layer_5_context",
    context_signals: "layer_5_context",
    fast_flux_dns: "fast_flux_dns",
    ssl_presence_and_validity: "ssl_presence_and_validity",
    path_anomaly_detection: "path_anomaly_detection",
    v1: "layer_1_lexical",
    v2: "cnn_visual_analysis",
    v4: "hgnn_analysis",
    v4_score: "hgnn_analysis",
    hgnn: "hgnn_analysis",
    hgnn_analysis: "hgnn_analysis",
  };

  const remapKey = (key: string): string => {
    const normalizedKey = key.replace(/[- ]+/g, "_").toLowerCase();
    return keyMap[normalizedKey] ?? normalizedKey;
  };

  const layer_scores: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(response.layer_scores ?? {})) {
    layer_scores[remapKey(key)] = value;
  }

  const details: Record<string, FeatureDetail | undefined> = {};
  for (const [key, value] of Object.entries(response.details ?? {})) {
    details[remapKey(key)] = value;
  }

  return {
    ...response,
    layer_scores,
    details,
  };
}

function detailState(
  score: number,
  message: string
): "pass" | "warn" | "fail" | "unavailable" {
  if (/unavailable|offline|skipped|error/i.test(message)) {
    return score > 0.2 ? "warn" : "pass";
  }
  if (score > 0.5) return "fail";
  if (score > 0.2) return "warn";
  return "pass";
}

const LAYER_LABELS: Record<string, string> = {
  layer_1_lexical: "Lexical heuristics",
  layer_2_network: "Network topology",
  layer_3_crypto: "Certificate & crypto",
  layer_5_context: "Contextual signals",
};

export function mapUnifiedScanResponse(
  scannedUrl: string,
  data: UnifiedScanResponse
): ScanEvaluation {
  const riskScore = Math.round((data.composite_score ?? 0) * 100);
  const safetyScore = 0;
  const { riskClass, riskLevel, headline } = riskFromScore(riskScore);
  const malicious = riskScore > 75;

  const flags: string[] = [];
  if (malicious && data.layer_scores) {
    for (const [key, value] of Object.entries(data.layer_scores)) {
      if (value != null) {
        // Run normalization before checking thresholds to keep UI logic pristine
        const normalizedValue = normalizeDetailScore(key, value);
        if (normalizedValue > 0.5) {
          const label = LAYER_LABELS[key] ?? key.replace(/_/g, " ");
          flags.push(`${label}: ${Math.round(normalizedValue * 100)}% risk signal`);
        }
      }
    }
  }

  const details: ScanEvaluation["details"] = {};

  if (data.details) {
    for (const [key, feat] of Object.entries(data.details)) {
      if (!feat?.message && feat?.score == null) continue;
      const rawScore = feat.score ?? 0;
      const score = normalizeDetailScore(key, rawScore);
      const state = detailState(score, feat.message ?? "");
      details[key] = {
        message: feat.message ?? key.replace(/_/g, " "),
        score,
        status: state,
      };
    }
  }

  if (data.layer_scores) {
    for (const [key, value] of Object.entries(data.layer_scores)) {
      if (value == null || details[key]) continue;
      const normalizedValue = normalizeDetailScore(key, value);
      const label = LAYER_LABELS[key] ?? key.replace(/_/g, " ");
      const state = layerState(normalizedValue);
      details[key] = {
        message: `${label} — ${Math.round(normalizedValue * 100)}% risk contribution`,
        score: normalizedValue,
        status: state,
      };
    }
  }

  return {
    verdict: malicious ? "malicious" : "safe",
    scannedUrl,
    riskScore,
    safetyScore,
    riskLevel,
    riskClass,
    headline,
    summary: malicious
      ? `${riskScore}% phishing risk detected across active ML and heuristic layers.`
      : `Risk score ${riskScore}%. No critical threats detected.`,
    flags,
    details,
    layerScores: data.layer_scores,
    latencyMs: data.latency_ms,
  };
}

function extractSenderDomain(from: string): string {
  const match = from.match(/@([^>\s]+)/);
  return match?.[1]?.toLowerCase() ?? "unknown.com";
}

function buildEmailRawText(input: {
  subject: string;
  from: string;
  body: string;
  headers?: string;
}): string {
  const lines: string[] = [];
  if (input.from.trim()) lines.push(`From: ${input.from.trim()}`);
  if (input.subject.trim()) lines.push(`Subject: ${input.subject.trim()}`);
  if (input.headers?.trim()) lines.push(input.headers.trim());
  if (input.body.trim()) {
    if (lines.length) lines.push("");
    lines.push(input.body.trim());
  }
  return lines.join("\n");
}

export function mapEmailScanResponse(
  data: EmailScanResponse,
  input: { subject: string; from: string; body: string }
): EmailEvaluation {
  const phishingScore = Math.round(data.risk_score ?? 0);
  const safetyScore = Math.max(0, 100 - phishingScore);
  const verdictUpper = (data.verdict ?? "").toUpperCase();
  const malicious = phishingScore > 70;

  const flags = data.details ? Object.values(data.details).filter(Boolean) : [];
  const combined = `${input.subject} ${input.body}`.toLowerCase();
  const spamKeywords = [
    "urgent",
    "immediate",
    "suspended",
    "verify",
    "click here",
    "winner",
    "password",
    "bank",
    "paypal",
  ].filter((w) => combined.includes(w));
  const suspiciousLinks = (input.body.match(/https?:\/\/[^\s<>"']+/gi) ?? []).filter(
    (l) => /bit\.ly|tinyurl|t\.co|ngrok|\.xyz|secure-login|verify/i.test(l)
  );

  return {
    verdict: malicious ? "malicious" : "safe",
    phishingScore,
    safetyScore,
    riskLevel:
      verdictUpper === "PHISHING"
        ? "Critical Risk"
        : verdictUpper === "SUSPICIOUS"
          ? "Suspicious"
          : data.label === "Spam"
            ? "Suspicious"
            : "Low Risk",
    headline: malicious ? "Phishing / Malicious Email" : "Safe / Verified",
    summary: malicious
      ? "The email scanner flagged spam or phishing patterns in language, links, or sender profile."
      : "No critical phishing indicators detected by the live email analysis engine.",
    flags,
    spamKeywords,
    suspiciousLinks,
  };
}

export function normalizeScanUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function fallbackScanEvaluation(url: string): ScanEvaluation {
  const normalized = normalizeScanUrl(url);
  const lower = normalized.toLowerCase();
  const suspicious = /paypal|bank|secure-login|verify-account|login-secure|apple-id|microsoft-login|account-verify|wallet-connect|signin-secure|\.xyz|\.top|\.click|\.tk|\.ml/i.test(lower);

  return {
    verdict: suspicious ? "malicious" : "safe",
    scannedUrl: normalized,
    riskScore: suspicious ? 72 : 10,
    safetyScore: suspicious ? 28 : 90,
    riskLevel: suspicious ? "Suspicious" : "Safe / Verified",
    riskClass: suspicious ? "warning" : "safe",
    headline: suspicious ? "Suspicious URL Detected" : "Safe / Verified",
    summary: suspicious
      ? "The live endpoint was unavailable, so the local fallback heuristic flagged this URL as suspicious."
      : "The live endpoint was unavailable, so the local fallback heuristic marked this URL as safe.",
    flags: suspicious ? ["Fallback heuristic triggered due to endpoint issue"] : [],
    details: {
      ssl_presence_and_validity: { message: "Fallback analysis", score: 0.1, status: suspicious ? "warn" : "pass" },
      threat_intelligence: { message: "Fallback analysis", score: 0.1, status: suspicious ? "warn" : "pass" },
      favicon_mismatch: { message: "Fallback analysis", score: 0.1, status: suspicious ? "warn" : "pass" },
      obfuscation_analysis: { message: "Fallback analysis", score: 0.1, status: suspicious ? "warn" : "pass" },
      fast_flux_dns: { message: "Fallback analysis", score: 0.1, status: suspicious ? "warn" : "pass" },
      url_structure_analysis: { message: "Fallback analysis", score: suspicious ? 0.7 : 0.1, status: suspicious ? "fail" : "pass" },
      path_anomaly_detection: { message: "Fallback analysis", score: suspicious ? 0.6 : 0.1, status: suspicious ? "warn" : "pass" },
    },
  };
}

export async function scanUrl(url: string): Promise<ScanEvaluation> {
  const normalized = normalizeScanUrl(url);

  try {
    const response = await postJson<UnifiedScanResponse>(
      URL_SCAN_ENDPOINT,
      { url: normalized },
      25000
    );
    const normalizedResponse = normalizeResponseKeys(response);
    return mapUnifiedScanResponse(normalized, normalizedResponse);
  } catch {
    return fallbackScanEvaluation(normalized);
  }
}

export async function scanEmail(input: {
  subject: string;
  from: string;
  body: string;
  headers?: string;
}): Promise<EmailEvaluation> {
  const raw_text = buildEmailRawText(input);
  if (!raw_text.trim()) {
    throw new Error("Email content is empty.");
  }

  const data = await postJson<EmailScanResponse>(EMAIL_SCAN_ENDPOINT, {
    msg_body: raw_text,
  });

  return mapEmailScanResponse(data, input);
}

function looksLikeUrl(value: string): boolean {
  try {
    const parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

export async function runAgenticScan(
  targetOrPayload: string | { url?: string; sender?: string; email_body?: string }
): Promise<AgenticScanResult> {
  const payload = typeof targetOrPayload === "string"
    ? (() => {
        const trimmed = targetOrPayload.trim();
        const isUrl = looksLikeUrl(trimmed);
        return isUrl
          ? {
              url: normalizeUrl(trimmed),
              sender: "",
              email_body: "",
            }
          : {
              url: "https://example.com",
              sender: "",
              email_body: trimmed,
            };
      })()
    : {
        url: targetOrPayload.url?.trim() ? normalizeUrl(targetOrPayload.url.trim()) : "",
        sender: targetOrPayload.sender?.trim() || "",
        email_body: targetOrPayload.email_body?.trim() || "",
      };

  const data = await postJson<AgenticResponse>(AGENTIC_ENDPOINT, payload);
  const finalEval = data.final_evaluation;

  return {
    targetUrl: data.target_url ?? payload.url,
    consensusReached: Boolean(data.consensus_reached),
    latencyMs: data.latency_ms,
    finalVerdict: finalEval?.final_verdict ?? finalEval?.verdict ?? "UNKNOWN",
    justification: finalEval?.verdict_justification ?? finalEval?.justification,
    agents: Object.entries(data.sub_agent_claims ?? {}).map(([name, claim]) => ({
      name,
      claim: claim.claim ?? "unknown",
      confidence: Math.round((claim.confidence ?? 0) * 100),
    })),
  };
}

function parseSandboxVerdict(raw?: string): SandboxVerdict {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("malicious") || v.includes("critical")) return "malicious";
  if (v.includes("suspicious") || v.includes("warn")) return "suspicious";
  if (
    v.includes("clean") ||
    v.includes("safe") ||
    v.includes("benign") ||
    v.includes("pass") ||
    v.includes("ok") ||
    v.includes("allowed") ||
    v.includes("verified") ||
    v.includes("no threat") ||
    v.includes("not detected")
  ) {
    return "clean";
  }
  if (
    v.includes("unknown") ||
    v.includes("unclassified") ||
    v.includes("no verdict") ||
    v.trim() === ""
  ) {
    return "unknown";
  }
  return "unknown";
}

function normalizeSandboxConfidence(raw?: number): number {
  if (raw == null || Number.isNaN(raw)) return 0;
  if (raw <= 1) return Math.round(raw * 100);
  if (raw <= 100) return Math.round(raw);
  return 100;
}

export async function runSandboxScan(target: string): Promise<SandboxScanResult> {
  const trimmed = target.trim();
  const url = looksLikeUrl(trimmed) ? normalizeUrl(trimmed) : `https://${trimmed}`;

  const data = await postJson<SandboxResponse>(SANDBOX_ENDPOINT, { url });

  return {
    url,
    verdict: parseSandboxVerdict(data.verdict),
    confidence: normalizeSandboxConfidence(data.confidence),
    pageTitle: data.raw?.page_title,
    networkConnections: data.raw?.total_network_connections,
    indicators: data.indicators ?? [],
    note: data.raw?.error,
  };
}