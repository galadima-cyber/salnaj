import { Link } from 'react-router-dom'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h1 className="text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to continue to your dashboard.</p>
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
          Login form coming soon.
        </div>
        <Link to="/register" className="mt-6 inline-block text-sm text-emerald-400">
          Create an account instead
        </Link>
      </div>
    </div>
  )
}
