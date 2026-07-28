import { Link } from 'react-router-dom'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h1 className="text-3xl font-semibold">Create your account</h1>
        <p className="mt-2 text-sm text-slate-400">Join Salnaj to manage your services.</p>
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
          Registration form coming soon.
        </div>
        <Link to="/login" className="mt-6 inline-block text-sm text-emerald-400">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  )
}
