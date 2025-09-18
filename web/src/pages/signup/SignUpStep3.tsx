import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext'

const EQUIPMENT_OPTIONS = [
  'Thermometer',
  'Blood Pressure Monitor',
  'Pulse Oximeter',
  'Glucose Meter',
  'Weight Scale',
  'Stethoscope',
  'First Aid Kit',
  'Oxygen Concentrator',
  'Nebulizer',
  'ECG Machine',
  'Defibrillator',
  'Wheelchair',
  'Walking Cane',
  'Crutches',
  'Other'
]

export default function SignUpStep3() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user came from step 2
    const step1Data = sessionStorage.getItem('signup_step1')
    const step2Data = sessionStorage.getItem('signup_step2')
    if (!step1Data || !step2Data) {
      navigate('/signup')
    }
  }, [navigate])

  const toggleEquipment = (equipment: string) => {
    setSelectedEquipment(prev => 
      prev.includes(equipment) 
        ? prev.filter(item => item !== equipment)
        : [...prev, equipment]
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const step1Data = JSON.parse(sessionStorage.getItem('signup_step1') || '{}')
      const step2Data = JSON.parse(sessionStorage.getItem('signup_step2') || '{}')
      
      const ok = await register({
        username: step1Data.username,
        email: step1Data.email,
        password: step1Data.password,
        name: step2Data.name,
        phone: step2Data.phone,
        gender: step2Data.gender,
        age: step2Data.age ? Number(step2Data.age) : undefined,
        address: step2Data.address || undefined,
        equipment: selectedEquipment,
      })
      
      if (ok) {
        // Clear signup data
        sessionStorage.removeItem('signup_step1')
        sessionStorage.removeItem('signup_step2')
        navigate('/home', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gray-950 text-gray-100 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.45),transparent)]">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Home Equipment</h1>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
          </div>
        </div>
        
        <p className="text-sm text-white/70 mb-4">
          Select any medical equipment you have at home (optional)
        </p>
        
        {error && <div className="mb-3 text-sm text-red-300">{error}</div>}
        
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {EQUIPMENT_OPTIONS.map((equipment) => (
              <label
                key={equipment}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedEquipment.includes(equipment)}
                  onChange={() => toggleEquipment(equipment)}
                  className="w-4 h-4 text-teal-600 bg-white/10 border-white/20 rounded focus:ring-teal-500 focus:ring-2"
                />
                <span className="text-sm text-white/90">{equipment}</span>
              </label>
            ))}
          </div>
          
          {selectedEquipment.length > 0 && (
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-white/70 mb-2">Selected Equipment:</p>
              <div className="flex flex-wrap gap-1">
                {selectedEquipment.map((equipment) => (
                  <span
                    key={equipment}
                    className="inline-block bg-teal-500/20 text-teal-300 text-xs px-2 py-1 rounded"
                  >
                    {equipment}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-700 px-4 py-2 text-white font-medium hover:bg-teal-600 transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/signup/info')}
            className="text-sm text-white/70 hover:text-white underline"
          >
            ← Back to Personal Details
          </button>
        </div>
      </div>
    </div>
  )
}
