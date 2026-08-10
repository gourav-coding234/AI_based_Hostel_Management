import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-5 text-center">
      <span className="font-display text-6xl font-semibold text-navy-950">404</span>
      <p className="text-slate-500">This page doesn't exist.</p>
      <Link to="/" className="rounded-full bg-navy-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-900">
        Back to home
      </Link>
    </div>
  );
}
