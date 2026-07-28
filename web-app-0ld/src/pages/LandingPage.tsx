import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">Salnaj</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Your wallet, airtime, data, and bills in one place.</h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Manage services, track payments, and keep your digital life moving with a simple dashboard.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link to="/login" className="rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-white">
            Login
          </Link>
          <Link to="/register" className="rounded-2xl border border-slate-700 px-5 py-3 font-medium text-slate-100">
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
