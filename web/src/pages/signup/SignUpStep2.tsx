import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext'

export default function SignUpStep2() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    gender: 'male',
    age: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user came from step 1
    const step1Data = sessionStorage.getItem('signup_step1')
    if (!step1Data) {
      navigate('/signup')
    }
  }, [navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!form.name || !form.phone) {
        setError('Name and Phone are required')
        setLoading(false)
        return
      }

      const step1Data = JSON.parse(sessionStorage.getItem('signup_step1') || '{}')
      
      const ok = await register({
        username: step1Data.username,
        email: step1Data.email,
        password: step1Data.password,
        name: form.name,
        phone: form.phone,
        gender: form.gender,
        age: form.age ? Number(form.age) : undefined,
        address: form.address || undefined,
      })
      
      if (ok) {
        // Clear signup data
        sessionStorage.removeItem('signup_step1')
        navigate('/home', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const goToEquipment = () => {
    // Store step 2 data and navigate to equipment step
    sessionStorage.setItem('signup_step2', JSON.stringify(form))
    navigate('/signup/equipment')
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gray-950 text-gray-100 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.45),transparent)]">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Personal Details</h1>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
          </div>
        </div>
        
        {error && <div className="mb-3 text-sm text-red-300">{error}</div>}
        
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm mb-1 text-white/90">Name</label>
            <input 
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              placeholder="Full name"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-white/90">Phone Number</label>
            <input 
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" 
              value={form.phone} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })} 
              placeholder="e.g., 9876543210"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1 text-white/90">Gender</label>
              <select 
                className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/90">Age</label>
              <input 
                type="number"
                className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" 
                value={form.age} 
                onChange={(e) => setForm({ ...form, age: e.target.value })} 
                placeholder="e.g., 25"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-white/90">Address</label>
            <textarea 
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40" 
              value={form.address} 
              onChange={(e) => setForm({ ...form, address: e.target.value })} 
              placeholder="Your address"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <button
              type="button"
              onClick={goToEquipment}
              className="w-full rounded-lg bg-teal-700 px-4 py-2 text-white font-medium hover:bg-teal-600 transition shadow-sm"
            >
              Add Equipment (Optional)
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white font-medium hover:bg-white/20 transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Skip Equipment & Create Account'}
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/signup')}
            className="text-sm text-white/70 hover:text-white underline"
          >
            ← Back to Step 1
          </button>
        </div>
      </div>
    </div>
  )
}
