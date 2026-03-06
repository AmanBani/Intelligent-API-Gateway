import Link from "next/link";

export default function OsiSystemArchitecturePage() {
  return (
    <div className="min-h-screen w-full bg-zinc-950 font-mono text-zinc-200">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            OSI system architecture
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Open Systems Interconnection model — 7 layers of network communication.
          </p>
          <Link
            href="/"
            className="mt-3 inline-block text-sm text-zinc-400 underline hover:text-white"
          >
            ← Back to home
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-zinc-400 text-center">
            OSI system architecture content coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
