import TriageBot from '../components/TriageBot'
import TriageTest from '../components/TriageTest'

export default function ConsultationPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Medical Consultation</h1>
        <p className="text-gray-300">Get instant medical guidance with our AI-powered symptom checker</p>
      </div>
      
      {/* Test Component - Remove this after testing */}
      <TriageTest />
      
      <TriageBot />
    </div>
  )
}


