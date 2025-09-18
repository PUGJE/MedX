import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUi } from '../state/UiContext'

export default function ProfilePage() {
  const { patient, setPatient } = useUi()
  const navigate = useNavigate()
  const [name, setName] = useState(patient.name ?? '')
  const [age, setAge] = useState(patient.age?.toString() ?? '')
  const [contact, setContact] = useState(patient.contact ?? '')
  const [village, setVillage] = useState(patient.village ?? '')
  const [pid, setPid] = useState(patient.patientId ?? '')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setPatient({
      name: name || 'Unnamed',
      age: age ? Number(age) : undefined,
      contact: contact || undefined,
      village: village || undefined,
      patientId: pid || undefined,
    })
    navigate('/home', { replace: true })
  }

  return (
    <div className="space-y-4 relative z-10">
      <h1 className="text-xl font-semibold">Patient Profile</h1>
      <form onSubmit={handleSave} className="space-y-3 relative z-20">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => navigate('/home')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-white text-sm font-medium hover:bg-teal-600 transition shadow-sm"
          >
            Save Profile
          </button>
        </div>
        <div className="bg-white/95 rounded-xl shadow-sm ring-1 ring-gray-200 p-4 space-y-3 relative z-10">
          <div>
            <label className="block text-sm mb-1 text-gray-700">Name</label>
            <input 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 relative z-10 bg-white" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Full name"
              autoComplete="name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1 text-gray-700">Age</label>
              <input 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 relative z-10 bg-white" 
                inputMode="numeric" 
                value={age} 
                onChange={(e) => setAge(e.target.value)} 
                placeholder="e.g., 34"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700">Contact No</label>
              <input 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 relative z-10 bg-white" 
                value={contact} 
                onChange={(e) => setContact(e.target.value)} 
                placeholder="e.g., 9876543210"
                autoComplete="tel"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1 text-gray-700">Village</label>
              <input 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 relative z-10 bg-white" 
                value={village} 
                onChange={(e) => setVillage(e.target.value)} 
                placeholder="Village"
                autoComplete="address-level2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700">Patient ID</label>
              <input 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 relative z-10 bg-white" 
                value={pid} 
                onChange={(e) => setPid(e.target.value)} 
                placeholder="PID-001"
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}


