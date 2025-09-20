import PatientCard from '../components/PatientCard'
import FeatureGrid from '../components/FeatureGrid'
import { useTranslation } from '../contexts/LanguageContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [calling, setCalling] = useState(false)
  const [lastDialed, setLastDialed] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const getEmergencyNumber = (address: any): string => {
    const countryCode = String(address?.country_code || '').toLowerCase()
    // Basic country-level mapping; refine later per state if needed
    if (countryCode === 'in') return '108' // India ambulance
    if (countryCode === 'us') return '911'
    if (countryCode === 'ca') return '911'
    if (countryCode === 'au') return '000'
    if (countryCode === 'nz') return '111'
    if (countryCode === 'gb' || countryCode === 'ie' || countryCode === 'fr' || countryCode === 'de' || countryCode === 'es' || countryCode === 'it') return '112'
    return '112'
  }

  const dialEmergency = async () => {
    if (calling) return
    setCalling(true)
    setStatus('Locating you...')
    try {
      const position: GeolocationPosition = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocation not supported'))
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 60000,
        })
      })

      const { latitude, longitude } = position.coords
      let number = '112'
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=5&addressdetails=1`
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
        const data = await res.json()
        number = getEmergencyNumber(data?.address)
        const region = data?.address?.state || data?.address?.county || data?.address?.country || 'your region'
        setStatus(`Detected ${region}. Dialing ${number}.`)
      } catch {
        // Fallbacks: assume India (108) if language hints region, else 112
        number = '108'
        setStatus(`Could not detect location precisely. Dialing ${number}.`)
      }

      setLastDialed(number)
      window.location.href = `tel:${number}`
    } catch (err: any) {
      // Geolocation failed; fallback to widely supported numbers
      const fallback = '108'
      setLastDialed(fallback)
      setStatus('Location unavailable. Using default emergency number.')
      window.location.href = `tel:${fallback}`
    } finally {
      setCalling(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/30 p-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">{t('home.welcome')}</h1>
        <p className="text-white/80">{t('home.subtitle')}</p>
      </div>

      {/* Patient Card with transparent effect */}
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/30 p-4">
        <PatientCard />
      </div>

      {/* Quick Actions */}
      <section className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/30 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={dialEmergency}
            disabled={calling}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {calling ? 'Preparing call...' : 'Emergency Call (Ambulance)'}
          </button>
          <button
            onClick={() => navigate('/donate')}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Donate (Blood/Organs)
          </button>
        </div>
        {(status || lastDialed) && (
          <div className="text-xs text-white/80 mt-3">
            {status ? status + ' ' : ''}
            {lastDialed ? `(Tap to call: ${lastDialed})` : ''}
          </div>
        )}
        <div className="text-[10px] text-white/60 mt-1">This opens your dialer; the call is not auto-placed.</div>
      </section>

      {/* Labs Section */}
      <section className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/30 p-4">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-white mb-2">Medical Tests & Labs</h2>
          <p className="text-white/80 text-sm">Find and book various medical tests</p>
        </div>
        <button
          onClick={() => navigate('/labs')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Browse All Tests
        </button>
      </section>

      {/* Feature Grid with transparent effect */}
      <section className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/30 p-4">
        <FeatureGrid />
      </section>
    </div>
  )
}


