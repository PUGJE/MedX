import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function SignUpPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    name: '',
    phone: '',
    email: '',
    gender: 'male',
    age: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!form.username || !form.name || !form.phone || !form.email) {
        setError('Username, Name, Phone, and Email are required')
        setLoading(false)
        return
      }
      const ok = await register({
        username: form.username,
        name: form.name,
        phone: form.phone,
        email: form.email,
        gender: form.gender,
        age: form.age ? Number(form.age) : undefined,
        address: form.address || undefined,
      })
      if (ok) navigate('/home', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gray-950 text-gray-100 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.45),transparent)]">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-5">
        <h1 className="text-2xl font-semibold text-white mb-4">Create account</h1>
        {error && <div className="mb-3 text-sm text-red-300">{error}</div>}
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm mb-1 text-white/90">Username</label>
            <input className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Unique username" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-white/90">Name</label>
            <input className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-white/90">Phone Number</label>
            <input className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-white/90">Email</label>
            <input type="email" className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1 text-white/90">Gender</label>
              <select className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="male" className="bg-gray-900">Male</option>
                <option value="female" className="bg-gray-900">Female</option>
                <option value="other" className="bg-gray-900">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/90">Age</label>
              <input inputMode="numeric" className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1 text-white/90">Address</label>
            <textarea rows={2} className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <button className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white py-2.5 font-medium" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
          <button type="button" onClick={() => navigate('/login')} className="w-full text-center text-sm text-white/80 hover:text-white">Back to login</button>
        </form>
      </div>
    </div>
  )
}


