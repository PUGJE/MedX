import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { UsersService, type Equipment } from '../lib/users.service'
import { FiUser, FiSettings, FiPlus, FiX } from 'react-icons/fi'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    name: '',
    phone: '',
    email: '',
    gender: 'male',
    age: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEquipment, setUserEquipment] = useState<Equipment[]>([])
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([])
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)
  const [equipmentLoading, setEquipmentLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        gender: user.gender,
        age: user.age?.toString() || '',
        address: user.address || '',
      })
      loadUserEquipment()
    }
  }, [user])

  const loadUserEquipment = async () => {
    if (!user?.id) return
    try {
      setEquipmentLoading(true)
      const equipment = await UsersService.getUserEquipment(user.id)
      setUserEquipment(equipment)
    } catch (err) {
      console.error('Failed to load user equipment:', err)
    } finally {
      setEquipmentLoading(false)
    }
  }

  const loadAvailableEquipment = async () => {
    try {
      const equipment = await UsersService.getEquipmentList()
      setAvailableEquipment(equipment)
    } catch (err) {
      console.error('Failed to load available equipment:', err)
    }
  }

  const addEquipment = async (equipmentId: string) => {
    if (!user?.id) return
    try {
      const equipment = availableEquipment.find(e => e.id === equipmentId)
      if (equipment) {
        await UsersService.addUserEquipment(user.id, [equipment.name])
        await loadUserEquipment()
        setShowEquipmentModal(false)
      }
    } catch (err) {
      console.error('Failed to add equipment:', err)
    }
  }

  const removeEquipment = async (equipmentId: string) => {
    if (!user?.id) return
    try {
      await UsersService.removeUserEquipment(user.id, [equipmentId])
      await loadUserEquipment()
    } catch (err) {
      console.error('Failed to remove equipment:', err)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const success = await updateProfile({
        name: form.name,
        phone: form.phone,
        email: form.email,
        gender: form.gender,
        age: form.age ? Number(form.age) : undefined,
        address: form.address || undefined,
      })
      
      if (success) {
        navigate('/home', { replace: true })
      } else {
        setError('Failed to update profile')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold shadow-lg shadow-teal-700/20">
          <FiUser className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Profile Settings</h1>
          <p className="text-sm text-gray-300">Manage your personal information and equipment</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FiUser className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-semibold text-white">Personal Information</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Username - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Username</label>
            <input 
              className="w-full rounded-lg border border-white/20 px-3 py-2 bg-white/5 text-gray-300 cursor-not-allowed" 
              value={form.username} 
              readOnly
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">Username cannot be changed after account creation</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Full Name</label>
            <input 
              className="w-full rounded-lg border border-white/20 px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </div>

          {/* Age and Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Age</label>
              <input 
                className="w-full rounded-lg border border-white/20 px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                inputMode="numeric" 
                value={form.age} 
                onChange={(e) => setForm({ ...form, age: e.target.value })} 
                placeholder="e.g., 34"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Gender</label>
              <select 
                className="w-full rounded-lg border border-white/20 px-3 py-2 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="male" className="bg-gray-800">Male</option>
                <option value="female" className="bg-gray-800">Female</option>
                <option value="other" className="bg-gray-800">Other</option>
              </select>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Phone Number</label>
            <input 
              className="w-full rounded-lg border border-white/20 px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
              value={form.phone} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })} 
              placeholder="e.g., 9876543210"
              autoComplete="tel"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Email</label>
            <input 
              type="email"
              className="w-full rounded-lg border border-white/20 px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              placeholder="email@example.com"
              autoComplete="email"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Address</label>
            <textarea 
              className="w-full rounded-lg border border-white/20 px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" 
              value={form.address} 
              onChange={(e) => setForm({ ...form, address: e.target.value })} 
              placeholder="Your address"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-white/20 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
              onClick={() => navigate('/home')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Equipment Management */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiSettings className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-semibold text-white">Medical Equipment</h2>
          </div>
          <button
            onClick={() => {
              loadAvailableEquipment()
              setShowEquipmentModal(true)
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add Equipment
          </button>
        </div>

        {equipmentLoading ? (
          <div className="text-center text-gray-400 py-4">Loading equipment...</div>
        ) : userEquipment.length === 0 ? (
          <div className="text-center text-gray-400 py-4">No equipment added yet</div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {userEquipment.map((equipment) => (
              <div key={equipment.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white">{equipment.name}</span>
                <button
                  onClick={() => removeEquipment(equipment.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipment Modal */}
      {showEquipmentModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowEquipmentModal(false)} />
          <div className="absolute inset-x-0 bottom-0 md:inset-0 md:m-auto md:h-fit md:max-w-lg md:rounded-xl md:border md:border-white/20 bg-gray-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add Equipment</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableEquipment.map((equipment) => (
                <button
                  key={equipment.id}
                  onClick={() => addEquipment(equipment.id)}
                  className="w-full text-left rounded-lg border border-white/20 px-4 py-3 bg-white/5 text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span>{equipment.name}</span>
                  <FiPlus className="w-4 h-4" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowEquipmentModal(false)}
              className="w-full mt-4 rounded-lg border border-white/20 px-4 py-2 text-gray-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


