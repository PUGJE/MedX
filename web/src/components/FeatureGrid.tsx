import { useNavigate } from 'react-router-dom'
import { FiFolder, FiHeart, FiPackage } from 'react-icons/fi'
import { FaStethoscope } from 'react-icons/fa'

export default function FeatureGrid() {
  const navigate = useNavigate()
  const tiles = [
    { title: 'Consultation', icon: <FaStethoscope size={28} />, to: '/consultation', color: 'bg-teal-50 text-teal-700' },
    { title: 'Check Symptoms', icon: <FiHeart size={28} />, to: '/symptoms', color: 'bg-pink-50 text-pink-700' },
    { title: 'Records', icon: <FiFolder size={28} />, to: '/records', color: 'bg-indigo-50 text-indigo-700' },
    { title: 'Medicines', icon: <FiPackage size={28} />, to: '/medicines', color: 'bg-emerald-50 text-emerald-700' },
  ]
  return (
    <div className="grid grid-cols-2 gap-4">
      {tiles.map((t) => (
        <button
          key={t.title}
          onClick={() => navigate(t.to)}
          className="bg-white/10 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-white/20 p-4 min-h-28 flex items-center gap-3 hover:-translate-y-0.5 active:scale-[0.99] transition-transform text-left"
        >
          <span className={`h-12 w-12 grid place-items-center rounded-lg bg-white/20 backdrop-blur-sm ring-1 ring-white/30 text-white`}>{t.icon}</span>
          <span>
            <span className="block font-semibold leading-tight text-white">{t.title}</span>
            <span className="block text-xs text-white/70">Tap to open</span>
          </span>
        </button>
      ))}
    </div>
  )
}


