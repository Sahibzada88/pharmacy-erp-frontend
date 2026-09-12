import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-display text-6xl font-semibold text-white/20">404</p>
      <h1 className="font-display text-xl font-semibold text-white">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-100/50">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-400"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
