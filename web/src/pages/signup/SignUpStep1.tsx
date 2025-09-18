import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SignUpStep1() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.username || !form.email || !form.password) {
      setError('All fields are required')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // Store step 1 data and navigate to step 2
    sessionStorage.setItem('signup_step1', JSON.stringify(form))
    navigate('/signup/info')
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gray-950 text-gray-100 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.45),transparent)]">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Create Account</h1>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
          </div>
        </div>
        
        {error && <div className="mb-3 text-sm text-red-300">{error}</div>}
        
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm mb-1 text-white/90">Username</label>
            <input 
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" 
              value={form.username} 
              onChange={(e) => setForm({ ...form, username: e.target.value })} 
              placeholder="Choose a unique username"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-white/90">Email</label>
            <input 
              type="email"
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-white/90">Password</label>
            <input 
              type="password"
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
              placeholder="At least 6 characters"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-white/90">Confirm Password</label>
            <input 
              type="password"
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" 
              value={form.confirmPassword} 
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} 
              placeholder="Confirm your password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-700 px-4 py-2 text-white font-medium hover:bg-teal-600 transition shadow-sm"
          >
            Next
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-white/70">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-teal-400 hover:text-teal-300 underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
