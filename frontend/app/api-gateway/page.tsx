"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server,
  Plus,
  Minus,
  Send,
  Loader2,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { getGatewayUrl, login, sendHello } from "@/lib/api-gateway";

type Step = 0 | 1 | 2 | 3;
const STEP_LABELS: Record<Step, string> = {
  0: "You (Client)",
  1: "API Gateway",
  2: "Load Balancer",
  3: "Servers",
};

interface ServerNode {
  id: string;
  name: string;
  port: number;
  active: boolean;
}

interface Message {
  id: string;
  type: "request" | "response" | "rejected";
  step: Step;
  targetServerIndex: number;
  body: string;
}

const DEFAULT_SERVERS: ServerNode[] = [
  { id: "s1", name: "Service 1", port: 7001, active: true },
  { id: "s2", name: "Service 2", port: 7002, active: true },
];

const STEP_DURATION_MS = 4500;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 30000;

// Backend code snippets (from your project)
const CODE_RATE_LIMITER = `# core/rate_limiter.py
RATE_LIMIT = 3       # max requests per window
WINDOW_SIZE = 30     # seconds

async def rate_limiter(request: Request):
    redis = await get_redis()
    payload = verify_token(request)
    user = payload.get("sub", request.client.host)
    key = f"rate_limit:{user}"

    current = await redis.get(key)
    if current is None:
        await redis.set(key, 1, ex=WINDOW_SIZE)
        return

    current = int(current)
    if current >= RATE_LIMIT:
        ttl = await redis.ttl(key)
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Try again in {ttl}s."
        )
    await redis.incr(key)`;

const CODE_LOAD_BALANCER = `# core/balancer.py
async def select_upstream(upstreams: List[str]) -> Optional[str]:
    redis = await get_redis()
    healthy_upstreams = {}

    for u in upstreams:
        health_key = f"{HEALTH_KEY_PREFIX}{u}"
        conn_key = f"{CONNECTION_KEY_PREFIX}{u}"
        health_val = await redis.get(health_key)
        conn_val = await redis.get(conn_key) or "0"

        if health_val == "1":  # healthy
            healthy_upstreams[u] = int(conn_val)

    if healthy_upstreams:
        # Least connections (or round-robin)
        selected = min(healthy_upstreams, key=healthy_upstreams.get)
        return selected
    return upstreams[0] if upstreams else None`;

const CODE_API_GATEWAY = `# main.py - proxy flow
@app.api_route("/{path:path}", methods=["GET","POST",...])
async def proxy(path: str, request: Request):
    # 1. JWT Auth
    user_payload = verify_token(request)

    # 2. Rate Limiter
    await rate_limiter(request)

    # 3. Select upstream (load balancer)
    upstream = await balancer.select_upstream(upstream_servers)

    # 4. Forward request to upstream
    async with httpx.AsyncClient() as client:
        resp = await client.request(
            method=request.method,
            url=f"{upstream}/{path}",
            headers=headers,
            content=await request.body(),
        )
    return Response(content=resp.content, status_code=resp.status_code)`;

const CODE_ROUND_ROBIN = `# Round Robin algorithm
# Distributes requests in turn to each server

import itertools

servers = ["http://localhost:7001", "http://localhost:7002"]
cycle = itertools.cycle(servers)

def get_next_server():
    return next(cycle)

# Each request gets the next server in order:
# Request 1 -> Server 1, Request 2 -> Server 2, Request 3 -> Server 1, ...
async def select_upstream_round_robin(upstreams):
    return next(itertools.cycle(upstreams))`;

export default function ApiGatewayPage() {
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [servers, setServers] = useState<ServerNode[]>(DEFAULT_SERVERS);
  const [nextServerIndex, setNextServerIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [rateLimitUsed, setRateLimitUsed] = useState(0);
  const [windowEnd, setWindowEnd] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [activeCodeTab, setActiveCodeTab] = useState<"rate" | "balancer" | "gateway" | "roundrobin">("rate");
  const [backendError, setBackendError] = useState<string | null>(null);
  const pendingResponseRef = useRef<{ targetServerIndex: number; body: string } | null>(null);
  const requestCancelledRef = useRef(false);

  useEffect(() => {
    setGatewayUrl(getGatewayUrl());
  }, []);

  const activeServers = servers.filter((s) => s.active);
  const backendConnected = Boolean(gatewayUrl);
  const canSend = backendConnected && activeServers.length > 0 && !sending;
  const isRateLimited = rateLimitUsed >= RATE_LIMIT_MAX && Date.now() < windowEnd;

  useEffect(() => {
    const t = setInterval(() => {
      if (windowEnd > 0 && Date.now() < windowEnd) {
        setSecondsLeft(Math.ceil((windowEnd - Date.now()) / 1000));
      } else if (windowEnd > 0 && Date.now() >= windowEnd) {
        setRateLimitUsed(0);
        setWindowEnd(0);
        setSecondsLeft(0);
      }
    }, 500);
    return () => clearInterval(t);
  }, [windowEnd]);

  const addServer = useCallback(() => {
    const n = servers.length + 1;
    setServers((prev) => [
      ...prev,
      { id: `s${n}`, name: `Service ${n}`, port: 7000 + n, active: true },
    ]);
  }, [servers.length]);

  const removeServer = useCallback(() => {
    if (servers.length <= 1) return;
    setServers((prev) => prev.slice(0, -1));
  }, [servers.length]);

  const toggleServer = useCallback((id: string) => {
    setServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  }, []);

  const sendRequest = useCallback(() => {
    if (!canSend || !gatewayUrl) return;

    const now = Date.now();
    if (now >= windowEnd) {
      setRateLimitUsed(0);
      setWindowEnd(now + RATE_LIMIT_WINDOW_MS);
      setSecondsLeft(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
    }
    if (rateLimitUsed >= RATE_LIMIT_MAX) return;

    setRateLimitUsed((c) => c + 1);
    setBackendError(null);
    setSending(true);
    requestCancelledRef.current = false;

    const targetIndex = nextServerIndex % activeServers.length;
    const id = `msg-${Date.now()}`;
    const requestMsg: Message = {
      id,
      type: "request",
      step: 0,
      targetServerIndex: targetIndex,
      body: `GET /hello`,
    };
    setMessages((prev) => [...prev, requestMsg]);
    setNextServerIndex((i) => i + 1);

    const advanceRequest = (nextStep: Step) => {
      if (requestCancelledRef.current) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.type === "request" ? { ...m, step: nextStep } : m
        )
      );
      if (nextStep < 3) {
        setTimeout(() => advanceRequest((nextStep + 1) as Step), STEP_DURATION_MS);
      } else {
        const pending = pendingResponseRef.current;
        const resTargetIndex = pending?.targetServerIndex ?? targetIndex;
        const resBody = pending?.body ?? `200 OK { "message": "Hello from server" }`;
        pendingResponseRef.current = null;

        setMessages((prev) => [
          ...prev,
          {
            id: `${id}-res`,
            type: "response",
            step: 3,
            targetServerIndex: resTargetIndex,
            body: resBody,
          },
        ]);
        const resId = `${id}-res`;
        const advanceResponse = (nextStep: Step) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === resId && m.type === "response"
                ? { ...m, step: nextStep }
                : m
            )
          );
          if (nextStep > 0) {
            setTimeout(() => advanceResponse((nextStep - 1) as Step), STEP_DURATION_MS);
          } else {
            setSending(false);
            setTimeout(() => {
              setMessages((prev) => prev.filter((m) => m.id !== id && m.id !== resId));
            }, 500);
          }
        };
        setTimeout(() => advanceResponse(2), STEP_DURATION_MS);
      }
    };

    login(gatewayUrl, "playground")
      .then((token) => sendHello(gatewayUrl, token))
      .then((result) => {
        if (!result.ok) {
          if (result.status === 429) {
            requestCancelledRef.current = true;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === id && m.type === "request" ? { ...m, step: 1 } : m
              )
            );
            setMessages((prev) => [
              ...prev,
              {
                id: `${id}-rej`,
                type: "rejected",
                step: 1,
                targetServerIndex: 0,
                body: result.detail || "429 Too many requests. Try again later.",
              },
            ]);
            setTimeout(() => {
              setMessages((prev) => prev.filter((m) => m.id !== id && m.id !== `${id}-rej`));
              setSending(false);
            }, 2500);
            return;
          }
          setBackendError(result.detail || `Error ${result.status}`);
          setSending(false);
          setMessages((prev) => prev.filter((m) => m.id !== id));
          return;
        }
        const idx = activeServers.findIndex(
          (s) => s.name.toLowerCase() === result.data.service?.toLowerCase()
        );
        const serverIndex = idx >= 0 ? idx : targetIndex;
        pendingResponseRef.current = {
          targetServerIndex: serverIndex,
          body: `${result.status} OK ${JSON.stringify(result.data)}`,
        };
      })
      .catch((err) => {
        setBackendError(err?.message || "Backend unreachable");
        setSending(false);
        setMessages((prev) => prev.filter((m) => m.id !== id));
      });

    setTimeout(() => advanceRequest(1), STEP_DURATION_MS);
  }, [canSend, sending, nextServerIndex, activeServers, rateLimitUsed, isRateLimited, gatewayUrl]);

  const trySendAndShowRateLimit = useCallback(() => {
    if (rateLimitUsed >= RATE_LIMIT_MAX && Date.now() < windowEnd) {
      const rejectId = `reject-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: rejectId,
          type: "rejected",
          step: 1,
          targetServerIndex: 0,
          body: "429 Too many requests. Try again later.",
        },
      ]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== rejectId));
      }, 2500);
      return;
    }
    sendRequest();
  }, [rateLimitUsed, windowEnd, sendRequest]);

  return (
    <div className="min-h-screen w-full bg-zinc-950 font-mono text-zinc-200">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header - centered */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            API Gateway Playground
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            You send requests. See rate limiting, load balancing, and how data flows.
          </p>
          <Link
            href="/"
            className="mt-3 inline-block text-sm text-zinc-400 underline hover:text-white"
          >
            ← Back to home
          </Link>
        </div>

        {!backendConnected && (
          <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-950/30 px-4 py-3 text-center text-sm text-amber-200">
            <strong>Backend not configured.</strong> In <code className="rounded bg-zinc-800 px-1">.env.local</code> set{" "}
            <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_API_GATEWAY_URL</code> or{" "}
            <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_API_URL</code> to your gateway URL (e.g.{" "}
            <code className="rounded bg-zinc-800 px-1">http://localhost:8000</code>), then <strong>restart the dev server</strong>.
          </div>
        )}

        {backendError && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-950/30 px-4 py-3 text-center text-sm text-red-200">
            <strong>Backend error:</strong> {backendError}
          </div>
        )}

        {/* You (human) + Send + Rate limit */}
        <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600/20 text-amber-400">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">You (Client)</p>
                <p className="text-xs text-zinc-500">Click to send a request</p>
              </div>
            </div>
            <button
              onClick={trySendAndShowRateLimit}
              disabled={!canSend}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-600"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send request
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
              <span className="text-xs text-zinc-500">Rate limit:</span>
              <span
                className={`text-sm font-medium ${
                  isRateLimited ? "text-red-400" : "text-zinc-300"
                }`}
              >
                {rateLimitUsed}/{RATE_LIMIT_MAX}
              </span>
              {windowEnd > 0 && Date.now() < windowEnd && (
                <span className="text-xs text-zinc-500">
                  · resets in {secondsLeft}s
                </span>
              )}
              {isRateLimited && (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" /> Too many requests
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Servers + Load balancing */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
          <span className="text-xs text-zinc-500">Servers (toggle on/off):</span>
          <div className="flex flex-wrap gap-2">
            {servers.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleServer(s.id)}
                className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs ${
                  s.active
                    ? "border-emerald-600 bg-emerald-950/50 text-emerald-400"
                    : "border-zinc-700 bg-zinc-800/50 text-zinc-500"
                }`}
              >
                <Server className="h-3 w-3" />
                {s.name} :{s.port}
              </button>
            ))}
            <button
              onClick={addServer}
              className="flex items-center gap-1 rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
              title="Add server"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={removeServer}
              disabled={servers.length <= 1}
              className="flex items-center gap-1 rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-40"
              title="Remove server"
            >
              <Minus className="h-3 w-3" />
            </button>
          </div>
          <span className="text-xs text-zinc-500">
            Load balancing: <span className="text-zinc-300">Round Robin</span>
          </span>
        </div>

        {/* Flow label with arrows */}
        <div className="mb-2 flex items-center justify-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <ArrowRight className="h-4 w-4 text-amber-500" />
            Request flow
          </span>
          <span className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4 text-emerald-500" />
            Response flow
          </span>
        </div>

        {/* Pipeline with arrows between columns */}
        <div className="mb-2 flex items-stretch gap-0 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          {([0, 1, 2] as Step[]).map((step) => (
            <React.Fragment key={step}>
              <div className="flex min-h-[220px] flex-1 flex-col rounded border border-zinc-700/50 bg-zinc-800/30">
                <div className="border-b-2 border-amber-500/60 bg-zinc-800/80 px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-amber-400">
                  {STEP_LABELS[step]}
                </div>
                <div className="relative flex-1 p-2">
                  <AnimatePresence mode="popLayout">
                    {messages
                      .filter((m) => m.step === step)
                      .map((m) => (
                        <motion.div
                          key={m.id}
                          layoutId={m.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.35 }}
                          className="absolute inset-2 mx-auto flex max-w-full flex-col rounded border bg-zinc-900 p-2 shadow"
                          style={{
                            borderColor:
                              m.type === "request"
                                ? "rgb(245 158 11 / 0.5)"
                                : m.type === "rejected"
                                  ? "rgb(239 68 68 / 0.6)"
                                  : "rgb(52 211 153 / 0.5)",
                          }}
                        >
                          <div className="flex items-center justify-between gap-1 text-[10px] text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {m.type === "request"
                                ? "Request"
                                : m.type === "rejected"
                                  ? "Rejected"
                                  : "Response"}
                            </span>
                            {m.type === "response" && (
                              <span className="flex items-center gap-0.5 text-emerald-500">
                                <ArrowLeft className="h-3 w-3" /> to Client
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-[10px]">
                            <div>
                              From:{" "}
                              {m.type === "request"
                                ? "You"
                                : m.type === "rejected"
                                  ? "You"
                                  : activeServers[m.targetServerIndex]?.name ?? "Server"}
                            </div>
                            <div>
                              To:{" "}
                              {m.type === "request"
                                ? activeServers[m.targetServerIndex]?.name ?? "Server"
                                : "You"}
                            </div>
                            <div className="mt-1 truncate font-medium text-zinc-300">
                              {m.body}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-col items-center justify-center gap-0.5 px-1 text-zinc-600">
                <ArrowRight className="h-5 w-5 text-amber-500/80" aria-label="Request flow" />
                <ArrowLeft className="h-5 w-5 text-emerald-500/80" aria-label="Response flow" />
              </div>
            </React.Fragment>
          ))}
          {/* Between LB and Servers: both directions */}
          <div className="flex flex-shrink-0 flex-col items-center justify-center gap-0.5 px-1 text-zinc-600">
            <ArrowRight className="h-5 w-5 text-amber-500/80" aria-label="Request flow" />
            <ArrowLeft className="h-5 w-5 text-emerald-500/80" aria-label="Response flow" />
          </div>
          {/* Servers column: visual LB → server boxes; server sends response back */}
          <div className="flex min-h-[220px] flex-1 flex-col rounded border border-zinc-700/50 bg-zinc-800/30">
            <div className="border-b-2 border-amber-500/60 bg-zinc-800/80 px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-amber-400">
              {STEP_LABELS[3]}
            </div>
            <div className="relative flex flex-1 flex-col justify-center gap-1 p-2">
              {/* Visual: Request incoming from Load Balancer */}
              <div className="flex items-center justify-center gap-1">
                <span className="text-[9px] text-zinc-500">Request →</span>
                <div className="h-px flex-1 max-w-[50%] bg-zinc-600" />
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-amber-500/80" />
              </div>
              {/* Server boxes linked to LB - request arrives, then response leaves */}
              <div className="flex flex-1 flex-wrap items-start justify-center gap-2">
                {activeServers.length === 0 ? (
                  <p className="py-4 text-center text-xs text-zinc-500">No servers active</p>
                ) : (
                  activeServers.map((srv, idx) => {
                    const msgAtThisServer = messages.find(
                      (m) => m.step === 3 && m.targetServerIndex === idx
                    );
                    return (
                      <div
                        key={srv.id}
                        className="relative flex min-h-[72px] min-w-[100px] flex-col items-center rounded-lg border-2 border-zinc-600 bg-zinc-900/80 p-2"
                      >
                        <Server className="h-5 w-5 text-emerald-500" />
                        <span className="mt-1 text-[10px] font-medium text-zinc-400">
                          {srv.name}
                        </span>
                        <span className="text-[9px] text-zinc-600">:{srv.port}</span>
                        <AnimatePresence mode="wait">
                          {msgAtThisServer && (
                            <motion.div
                              key={msgAtThisServer.id}
                              layoutId={msgAtThisServer.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.35 }}
                              className="absolute -inset-0.5 flex flex-col rounded border bg-zinc-900 p-1.5"
                              style={{
                                borderColor:
                                  msgAtThisServer.type === "request"
                                    ? "rgb(245 158 11 / 0.6)"
                                    : "rgb(52 211 153 / 0.6)",
                              }}
                            >
                              <div className="flex items-center justify-between gap-0.5 text-[9px] text-zinc-500">
                                <span className="flex items-center gap-0.5">
                                  <Mail className="h-2.5 w-2.5" />
                                  {msgAtThisServer.type === "request" ? "Req" : "Res"}
                                </span>
                                {msgAtThisServer.type === "response" && (
                                  <span className="flex items-center text-emerald-500">
                                    <ArrowLeft className="h-2.5 w-2.5" /> back
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 truncate text-[9px] text-zinc-400">
                                {msgAtThisServer.body}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
              {/* Visual: Response going back from servers toward Load Balancer → Client */}
              <div className="flex items-center justify-center gap-1 border-t border-zinc-700/50 pt-2">
                <ArrowLeft className="h-4 w-4 flex-shrink-0 text-emerald-500/80" />
                <div className="h-px flex-1 max-w-[50%] bg-zinc-600" />
                <span className="text-[9px] text-zinc-500">← Response to Client</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mb-10 text-center text-xs text-zinc-600">
          Request: You → Gateway → Load Balancer → Server. Response: Server → Load Balancer → Gateway → You (same path back). After {RATE_LIMIT_MAX} requests you are rate limited for 30s.
        </p>

        {/* Backend code section */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
          <div className="border-b border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-400">
            Backend code
          </div>
          <div className="flex flex-wrap border-b border-zinc-800">
            {(
              [
                { id: "rate" as const, label: "Rate Limiting" },
                { id: "balancer" as const, label: "Load Balancer" },
                { id: "gateway" as const, label: "API Gateway" },
                { id: "roundrobin" as const, label: "Round Robin" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveCodeTab(id)}
                className={`border-b-2 px-4 py-2 text-xs font-medium transition ${
                  activeCodeTab === id
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="max-h-[320px] overflow-auto p-4">
            <pre className="text-xs leading-relaxed text-zinc-400">
              <code>
                {activeCodeTab === "rate" && CODE_RATE_LIMITER}
                {activeCodeTab === "balancer" && CODE_LOAD_BALANCER}
                {activeCodeTab === "gateway" && CODE_API_GATEWAY}
                {activeCodeTab === "roundrobin" && CODE_ROUND_ROBIN}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
