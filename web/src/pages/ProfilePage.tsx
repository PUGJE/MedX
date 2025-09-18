import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
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

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        gender: user.gender,
        age: user.age?.toString() || '',
        address: user.address || '',
      })
    }
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const success = await updateProfile({
        username: form.username,
        name: form.name,
        phone: form.phone,
        email: form.email,
        gender: form.gender,
        age: form.age ? Number(form.age) : undefined,
        address: form.address || undefined,
      })
      
      if (success) {
        navigate('/home', { replace: true })
      } else {
        setError('Failed to update profile')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 relative z-10">
      <h1 className="text-xl font-semibold">Profile Settings</h1>
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-3 relative z-20">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => navigate('/home')}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-white text-sm font-medium hover:bg-teal-600 transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
        <div className="bg-white/95 rounded-xl shadow-sm ring-1 ring-gray-200 p-4 space-y-3 relative z-10">
          <div>
            <label className="block text-sm mb-1 text-gray-700">Username</label>
            <input 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 relative z-10 bg-white" 
              value={form.username} 
              onChange={(e) => setForm({ ...form, username: e.target.value })} 
              placeholder="Username"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700">Name</label>
            <input 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 relative z-10 bg-white" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              placeholder="Full name"
              autoComplete="name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1 text-gray-700">Age</label>
              <input 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 relative z-10 bg-white" 
                inputMode="numeric" 
                value={form.age} 
                onChange={(e) => setForm({ ...form, age: e.target.value })} 
                placeholder="e.g., 34"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700">Gender</label>
              <select 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 relative z-10 bg-white"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700">Phone Number</label>
            <input 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 relative z-10 bg-white" 
              value={form.phone} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })} 
              placeholder="e.g., 9876543210"
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700">Email</label>
            <input 
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 relative z-10 bg-white" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              placeholder="email@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700">Address</label>
            <textarea 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 relative z-10 bg-white" 
              value={form.address} 
              onChange={(e) => setForm({ ...form, address: e.target.value })} 
              placeholder="Your address"
              rows={3}
            />
          </div>
        </div>
      </form>
    </div>
  )
}


