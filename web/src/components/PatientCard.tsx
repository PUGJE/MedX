import { useNavigate } from 'react-router-dom'
import { useUi } from '../state/UiContext'

export default function PatientCard() {
  const { patient } = useUi()
  const navigate = useNavigate()
  return (
    <section className="bg-white/10 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-white/20 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="h-12 w-12 rounded-full bg-teal-600 text-white grid place-items-center font-semibold shadow-lg shadow-teal-700/20 focus:outline-none focus:ring-2 focus:ring-teal-400"
          onClick={() => navigate('/profile')}
        >
          {patient.name?.[0]?.toUpperCase() || 'P'}
        </button>
        <div className="min-w-0">
          <p className="text-xs text-white/70">Patient</p>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="text-left text-lg font-semibold leading-tight truncate hover:underline text-white"
          >
            {patient.name || 'Demo Patient'}
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-white/20 p-3">
          <p className="text-white/70">Village</p>
          <p className="font-medium text-white">{patient.village || 'Village X'}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-white/20 p-3">
          <p className="text-white/70">Patient ID</p>
          <p className="font-medium text-white">{patient.patientId || 'PID-001'}</p>
        </div>
      </div>
    </section>
  )
}


