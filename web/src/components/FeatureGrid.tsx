import { useNavigate } from 'react-router-dom'
import { FiFolder, FiHeart, FiPackage } from 'react-icons/fi'
import { FaStethoscope } from 'react-icons/fa'
import { useTranslation } from '../contexts/LanguageContext'

export default function FeatureGrid() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  const tiles = [
    { title: t('nav.consultation'), icon: <FaStethoscope size={28} />, to: '/consultation', color: 'bg-teal-50 text-teal-700' },
    { title: t('home.checkSymptoms'), icon: <FiHeart size={28} />, to: '/symptoms', color: 'bg-pink-50 text-pink-700' },
    { title: t('nav.records'), icon: <FiFolder size={28} />, to: '/records', color: 'bg-indigo-50 text-indigo-700' },
    { title: t('nav.medicines'), icon: <FiPackage size={28} />, to: '/medicines', color: 'bg-emerald-50 text-emerald-700' },
  ]
  return (
    <div className="grid grid-cols-2 gap-4">
      {tiles.map((tile) => (
        <button
          key={tile.title}
          onClick={() => navigate(tile.to)}
          className="bg-white/10 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-white/20 p-4 min-h-28 flex items-center gap-3 hover:-translate-y-0.5 active:scale-[0.99] transition-transform text-left"
        >
          <span className={`h-12 w-12 grid place-items-center rounded-lg bg-white/20 backdrop-blur-sm ring-1 ring-white/30 text-white`}>{tile.icon}</span>
          <span>
            <span className="block font-semibold leading-tight text-white">{tile.title}</span>
            <span className="block text-xs text-white/70">{t('common.tapToOpen')}</span>
          </span>
        </button>
      ))}
    </div>
  )
}


