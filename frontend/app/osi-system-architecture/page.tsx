"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Layers } from "lucide-react";
import Link from "next/link";
import { simulateOsiLayers, type LayerInfo } from "@/lib/osi-api";

const LAYER_COLORS: Record<number, string> = {
  7: "border-violet-500/60 bg-violet-950/20",
  6: "border-indigo-500/60 bg-indigo-950/20",
  5: "border-blue-500/60 bg-blue-950/20",
  4: "border-cyan-500/60 bg-cyan-950/20",
  3: "border-teal-500/60 bg-teal-950/20",
  2: "border-emerald-500/60 bg-emerald-950/20",
  1: "border-amber-500/60 bg-amber-950/20",
};

const LAYER_LABELS: Record<number, string> = {
  7: "Application",
  6: "Presentation",
  5: "Session",
  4: "Transport",
  3: "Network",
  2: "Data Link",
  1: "Physical",
};

function LayerCard({
  layer,
  data,
  headers,
  description,
  isRevealed,
  delay,
}: {
  layer: number;
  data: string;
  headers: Record<string, string | number> | null;
  description: string;
  isRevealed: boolean;
  delay: number;
}) {
  const truncate = (s: string, max: number) =>
    s.length > max ? s.slice(0, max) + "…" : s;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-lg border p-4 ${LAYER_COLORS[layer] || "border-zinc-600"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-zinc-400">
          Layer {layer}
        </span>
        <span className="text-sm font-semibold text-white">
          {LAYER_LABELS[layer]}
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
      <AnimatePresence mode="wait">
        {isRevealed ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 space-y-2"
          >
            <div className="rounded bg-zinc-900/80 px-2 py-2 font-mono text-xs text-zinc-300 break-all">
              {truncate(data, 120)}
            </div>
            {headers && Object.keys(headers).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(headers).map(([k, v]) => (
                  <span
                    key={k}
                    className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
                  >
                    {k}: {String(v)}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 h-10 rounded bg-zinc-900/50"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function OsiSystemArchitecturePage() {
  const [message, setMessage] = useState("Hello World");
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [summary, setSummary] = useState<{ total_bytes_app: number; total_bits_physical: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);

  const runSimulation = useCallback(async () => {
    setError(null);
    setLayers([]);
    setSummary(null);
    setRevealedCount(0);
    setLoading(true);

    const result = await simulateOsiLayers(message, "http");
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setLayers(result.data.layers);
    setSummary(result.data.summary);

    // Animate layers appearing one by one
    for (let i = 0; i < result.data.layers.length; i++) {
      await new Promise((r) => setTimeout(r, 400));
      setRevealedCount((c) => c + 1);
    }
  }, [message]);

  return (
    <div className="min-h-screen w-full bg-zinc-950 font-mono text-zinc-200">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            OSI System Architecture
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            See how data is encapsulated as it flows through the 7 layers
          </p>
          <Link
            href="/"
            className="mt-3 inline-block text-sm text-zinc-400 underline hover:text-white"
          >
            ← Back to home
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-950/30 px-4 py-3 text-center text-sm text-red-200">
            {error}
            <p className="mt-1 text-xs text-red-300/80">
              Ensure backend3 is running: <code>cd backend3 && uvicorn main:app --reload --port 8003</code>
            </p>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-zinc-500">Message to send through OSI stack</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSimulation()}
              placeholder="Enter a message..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              disabled={loading}
            />
          </div>
          <button
            onClick={runSimulation}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-6 py-3 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Simulate
          </button>
        </div>

        {summary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex flex-wrap gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
          >
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Layers className="h-4 w-4 text-amber-500" />
              Application: {summary.total_bytes_app} bytes
            </span>
            <span className="text-xs text-zinc-400">
              Physical: {summary.total_bits_physical} bits
            </span>
          </motion.div>
        )}

        <div className="space-y-3">
          {layers.map((l, i) => (
            <div key={l.layer} className="flex items-stretch gap-2">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-amber-400">
                  {l.layer}
                </div>
                {i < layers.length - 1 && (
                  <div className="mt-1 h-6 w-px flex-1 bg-zinc-700" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <LayerCard
                  layer={l.layer}
                  data={l.data}
                  headers={l.headers_added}
                  description={l.description}
                  isRevealed={i < revealedCount}
                  delay={i * 0.05}
                />
              </div>
            </div>
          ))}
        </div>

        {layers.length > 0 && (
          <p className="mt-8 text-center text-xs text-zinc-600">
            Data flows down: Application → Presentation → Session → Transport → Network → Data Link → Physical
          </p>
        )}
      </div>
    </div>
  );
}
