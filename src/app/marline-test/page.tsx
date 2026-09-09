"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Play,
  RotateCw,
  Cpu,
  Layers,
  AlertTriangle,
  Sparkles,
  BarChart3,
} from "lucide-react";

interface ProviderMetaInfo {
  id: string;
  name: string;
  priority: number;
  models: string[];
  defaultModel: string;
  isConfigured: boolean;
  health: {
    healthy: boolean;
    cooldownRemainingSec: number;
    consecutiveFailures: number;
    lastCategory?: string;
  };
}

interface ProviderTestResult {
  provider: string;
  model: string;
  ttftMs: number;
  totalMs: number;
  inputTokens: number;
  outputTokens: number;
  tokensPerSec: number;
  status: "SUCCESS" | "FAILED" | "IDLE" | "TESTING";
  httpStatus?: number;
  error?: {
    category: string;
    message: string;
    status?: number;
  };
  contentSample?: string;
}

const DEFAULT_PROMPT =
  "Explain artificial intelligence in simple terms in 5 bullet points.";

export default function MarlineTestPage() {
  const [providers, setProviders] = useState<ProviderMetaInfo[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [outputSize, setOutputSize] = useState<"short" | "normal" | "detailed">("normal");
  const [streaming, setStreaming] = useState(true);
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ProviderTestResult>>({});
  const [isBenchmarkingAll, setIsBenchmarkingAll] = useState(false);

  // Load server-side provider metadata on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch("/api/marline-test");
        if (res.ok) {
          const data = await res.json();
          setProviders(data.providers || []);
          const initialModels: Record<string, string> = {};
          const initialResults: Record<string, ProviderTestResult> = {};
          (data.providers || []).forEach((p: ProviderMetaInfo) => {
            initialModels[p.id] = p.defaultModel;
            initialResults[p.id] = {
              provider: p.id,
              model: p.defaultModel,
              ttftMs: 0,
              totalMs: 0,
              inputTokens: 0,
              outputTokens: 0,
              tokensPerSec: 0,
              status: "IDLE",
            };
          });
          setSelectedModels(initialModels);
          setResults(initialResults);
        }
      } catch (e) {
        console.error("Failed to load provider metadata:", e);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadMeta();
  }, []);

  const handleModelChange = (providerId: string, model: string) => {
    setSelectedModels((prev) => ({ ...prev, [providerId]: model }));
  };

  const testProvider = async (providerId: string) => {
    const model = selectedModels[providerId] || "";

    setResults((prev) => ({
      ...prev,
      [providerId]: {
        provider: providerId,
        model,
        ttftMs: 0,
        totalMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        tokensPerSec: 0,
        status: "TESTING",
        contentSample: "",
      },
    }));

    try {
      const response = await fetch("/api/marline-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          model,
          prompt,
          outputSize,
          stream: streaming,
        }),
      });

      if (streaming && response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let streamedContent = "";

        if (reader) {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ") && !trimmed.includes("[DONE]")) {
                try {
                  const event = JSON.parse(trimmed.slice(6));
                  if (event.type === "chunk" && event.text) {
                    streamedContent += event.text;
                    setResults((prev) => ({
                      ...prev,
                      [providerId]: {
                        ...prev[providerId],
                        contentSample: streamedContent,
                      },
                    }));
                  } else if (event.type === "metrics" && event.metrics) {
                    setResults((prev) => ({
                      ...prev,
                      [providerId]: {
                        ...event.metrics,
                        contentSample: streamedContent,
                      },
                    }));
                  } else if (event.type === "error" && event.metrics) {
                    setResults((prev) => ({
                      ...prev,
                      [providerId]: event.metrics,
                    }));
                  }
                } catch {
                  // Ignore parsing error for partial lines
                }
              }

            }
          }
        }
      } else {
        const data = await response.json();
        setResults((prev) => ({
          ...prev,
          [providerId]: data,
        }));
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Network test failure";
      setResults((prev) => ({
        ...prev,
        [providerId]: {
          provider: providerId,
          model,
          ttftMs: 0,
          totalMs: 0,
          inputTokens: 0,
          outputTokens: 0,
          tokensPerSec: 0,
          status: "FAILED",
          error: {
            category: "CLIENT_ERROR",
            message: errMsg,
          },
        },
      }));
    }
  };

  const testAllProviders = async () => {
    setIsBenchmarkingAll(true);
    const promises = providers.map((p) => testProvider(p.id));
    await Promise.allSettled(promises);
    setIsBenchmarkingAll(false);
  };

  const getStatusBadge = (res?: ProviderTestResult) => {
    if (!res || res.status === "IDLE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          Ready
        </span>
      );
    }
    if (res.status === "TESTING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/80 animate-pulse">
          <RotateCw className="w-3 h-3 animate-spin" />
          Testing...
        </span>
      );
    }
    if (res.status === "SUCCESS") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          SUCCESS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-800/80">
        <XCircle className="w-3 h-3 text-rose-400" />
        FAILED
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30">
                <Cpu className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                  Marline AI Provider Lab
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    5-Layer Engine
                  </span>
                </h1>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Multi-Layer Architecture Testing, Zero-Fallback Isolation & Real-Time Performance Benchmarking
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={testAllProviders}
              disabled={isBenchmarkingAll || loadingConfig}
              className="px-4 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/50 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <BarChart3 className="w-4 h-4" />
              {isBenchmarkingAll ? "Benchmarking All..." : "Run All Providers"}
            </button>
          </div>
        </div>

        {/* Global Controls */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Benchmark Prompt
            </label>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span>Output Tokens:</span>
                <div className="flex bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700/60">
                  {(["short", "normal", "detailed"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setOutputSize(size)}
                      className={`px-2.5 py-1 rounded-md capitalize text-xs font-medium transition-colors ${
                        outputSize === size
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span>Streaming:</span>
                <button
                  onClick={() => setStreaming(!streaming)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    streaming
                      ? "bg-emerald-950/70 text-emerald-300 border-emerald-800"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {streaming ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all resize-none"
            placeholder="Enter test prompt..."
          />
        </div>

        {/* 5 Provider Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {providers.map((p) => {
            const res = results[p.id];
            const currentModel = selectedModels[p.id] || p.defaultModel;

            return (
              <div
                key={p.id}
                className={`flex flex-col justify-between bg-zinc-900/60 border rounded-2xl p-4.5 backdrop-blur-md transition-all duration-200 hover:border-zinc-700/80 ${
                  res?.status === "SUCCESS"
                    ? "border-emerald-900/40 shadow-lg shadow-emerald-950/20"
                    : res?.status === "FAILED"
                    ? "border-rose-900/40 shadow-lg shadow-rose-950/20"
                    : "border-zinc-800/80"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          Layer {p.priority}
                        </span>
                        {!p.isConfigured && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60">
                            Unconfigured
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-base text-zinc-100 mt-1">
                        {p.name}
                      </h3>
                    </div>
                    {getStatusBadge(res)}
                  </div>

                  {/* Model Selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-400">
                      Model
                    </label>
                    <select
                      value={currentModel}
                      onChange={(e) => handleModelChange(p.id, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {p.models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Metrics Box */}
                  <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        TTFT:
                      </span>
                      <span className="font-mono text-zinc-200">
                        {res?.ttftMs ? `${(res.ttftMs / 1000).toFixed(2)}s` : "--"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-zinc-500" />
                        Speed:
                      </span>
                      <span className="font-mono text-emerald-400 font-medium">
                        {res?.tokensPerSec ? `${res.tokensPerSec} tok/s` : "--"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-zinc-500" />
                        Total:
                      </span>
                      <span className="font-mono text-zinc-200">
                        {res?.totalMs ? `${(res.totalMs / 1000).toFixed(2)}s` : "--"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-zinc-800/60 text-[11px]">
                      <span>In / Out:</span>
                      <span className="font-mono text-zinc-400">
                        {res?.inputTokens ? `${res.inputTokens}t` : "0t"} /{" "}
                        {res?.outputTokens ? `${res.outputTokens}t` : "0t"}
                      </span>
                    </div>
                  </div>

                  {/* Error Box if Failed */}
                  {res?.status === "FAILED" && res.error && (
                    <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-2.5 text-xs text-rose-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-[11px] text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {res.error.category}
                      </div>
                      <p className="text-[11px] leading-tight text-rose-300/90 line-clamp-3">
                        {res.error.message}
                      </p>
                      <div className="text-[10px] text-zinc-400 pt-0.5">
                        Fallback was NOT used
                      </div>
                    </div>
                  )}

                  {/* Output Preview Drawer */}
                  {res?.status === "SUCCESS" && res.contentSample && (
                    <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-2.5 text-[11px] text-zinc-300">
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                        Response Preview
                      </div>
                      <p className="line-clamp-4 leading-relaxed font-sans text-zinc-300">
                        {res.contentSample}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                <div className="pt-4 mt-2">
                  <button
                    onClick={() => testProvider(p.id)}
                    disabled={res?.status === "TESTING"}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Test Provider
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Comparison Table */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Multi-Layer Benchmarking Comparison
            </h2>
            <span className="text-xs text-zinc-400">
              Direct Provider Testing (No Fallback)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 text-zinc-400 font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="pb-3 px-3">Provider</th>
                  <th className="pb-3 px-3">Layer</th>
                  <th className="pb-3 px-3">Model</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">TTFT</th>
                  <th className="pb-3 px-3">Total Time</th>
                  <th className="pb-3 px-3">Generation Speed</th>
                  <th className="pb-3 px-3">Error / Diagnostics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {providers.map((p) => {
                  const res = results[p.id];
                  const model = selectedModels[p.id] || p.defaultModel;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-3 font-medium text-zinc-200">
                        {p.name}
                      </td>
                      <td className="py-3 px-3 text-zinc-400">
                        Layer {p.priority}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-zinc-400 max-w-[200px] truncate">
                        {model}
                      </td>
                      <td className="py-3 px-3">
                        {getStatusBadge(res)}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {res?.ttftMs ? `${(res.ttftMs / 1000).toFixed(2)}s` : "--"}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {res?.totalMs ? `${(res.totalMs / 1000).toFixed(2)}s` : "--"}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-emerald-400">
                        {res?.tokensPerSec ? `${res.tokensPerSec} tok/s` : "--"}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-zinc-400 max-w-[250px] truncate">
                        {res?.status === "FAILED"
                          ? `[${res.error?.category}] ${res.error?.message}`
                          : res?.status === "SUCCESS"
                          ? "✓ Operational"
                          : "Awaiting test"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
