import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { FiLock } from 'react-icons/fi'
import { SparklesCore } from '../components/ui/sparkles'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as any
  const [username, setUsername] = useState('yts')
  const [password, setPassword] = useState('123')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const ok = await login(username.trim(), password)
    setLoading(false)
    if (ok) {
      const to = location.state?.from?.pathname || '/home'
      navigate(to, { replace: true })
    } else {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gray-950 text-gray-100 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.45),transparent)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-4">
          {/* MedX Branding with Sparkles extending behind Sign in */}
          <div className="relative h-28 w-full flex flex-col items-center justify-center overflow-hidden rounded-md mb-0">
            <h1 className="text-4xl font-bold text-center text-white relative z-20">
              MedX
            </h1>
            <div className="w-full h-32 relative pointer-events-none">
              {/* Gradients */}
              <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-teal-500 to-transparent h-[2px] w-3/4 blur-sm" />
              <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-teal-500 to-transparent h-px w-3/4" />
              <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
              <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />

              {/* Core component */}
              <SparklesCore
                background="transparent"
                minSize={0.4}
                maxSize={1}
                particleDensity={1200}
                className="w-full h-full"
                particleColor="#FFFFFF"
              />

              {/* Radial Gradient to prevent sharp edges - extended to cover sign in area */}
              <div className="absolute inset-0 w-full h-full bg-gray-950 [mask-image:radial-gradient(400px_300px_at_center,transparent_30%,white)]"></div>
            </div>
            
            {/* Sign in text positioned over the sparkles */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <h2 className="text-2xl font-semibold text-white relative z-20">Sign in</h2>
              <p className="text-sm text-gray-300 relative z-20">Use the demo credentials below</p>
            </div>
          </div>
        </div>
        <form className="space-y-4 relative z-30" onSubmit={handleSubmit}>
          {/* Username Box */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/30 p-4">
            <label className="block text-sm mb-2 text-white/90 font-medium">Username</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 grid place-items-center pl-3 text-white/60">
                <FiLock size={16} />
              </span>
              <input
                className={`w-full rounded-xl border-0 bg-white/10 backdrop-blur-sm px-10 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:bg-white/20 transition-all duration-200 relative z-10 ${error ? 'ring-2 ring-red-400/50' : ''}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
          </div>

          {/* Password Box */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/30 p-4">
            <label className="block text-sm mb-2 text-white/90 font-medium">Password</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 grid place-items-center pl-3 text-white/60">
                <FiLock size={16} />
              </span>
              <input
                className={`w-full rounded-xl border-0 bg-white/10 backdrop-blur-sm px-10 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:bg-white/20 transition-all duration-200 relative z-10 ${error ? 'ring-2 ring-red-400/50' : ''}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
          </div>

          {/* Sign In Button */}
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-6 py-3 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl w-full active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {/* Demo Credentials */}
          <p className="text-xs text-white/70 text-center">
            Demo: <span className="font-medium text-white/90">yts</span> / <span className="font-medium text-white/90">123</span>
          </p>
        </form>
      </div>
    </div>
  )
}


