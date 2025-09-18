import PatientCard from '../components/PatientCard'
import FeatureGrid from '../components/FeatureGrid'

export default function HomePage() {
  return (
    <div className="space-y-6">
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


