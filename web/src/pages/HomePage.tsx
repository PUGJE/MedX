import PatientCard from '../components/PatientCard'
import FeatureGrid from '../components/FeatureGrid'
import { useTranslation } from '../contexts/LanguageContext'

export default function HomePage() {
  const { t } = useTranslation()
  
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

      {/* Feature Grid with transparent effect */}
      <section className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/30 p-4">
        <FeatureGrid />
      </section>
    </div>
  )
}


