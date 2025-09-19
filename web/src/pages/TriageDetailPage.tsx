import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { TriageHistoryService, type TriageHistory } from '../lib/triageHistory.service'
import { useAuth } from '../state/AuthContext'
import { FiArrowLeft, FiUser, FiCalendar, FiActivity, FiAlertTriangle, FiCheckCircle, FiClock, FiHeart, FiThermometer, FiDroplet } from 'react-icons/fi'

export default function TriageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [triage, setTriage] = useState<TriageHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Invalid triage ID')
      setLoading(false)
      return
    }

    async function loadTriage() {
      try {
        setLoading(true)
        const foundTriage = await TriageHistoryService.getById(id)
        
        if (!foundTriage) {
          setError('Triage record not found')
        } else {
          setTriage(foundTriage)
        }
      } catch (err) {
        setError('Failed to load triage record')
        console.error('Error loading triage:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTriage()
  }, [id, user?.username])

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <FiAlertTriangle className="w-5 h-5" />
      case 'medium':
        return <FiClock className="w-5 h-5" />
      case 'low':
        return <FiCheckCircle className="w-5 h-5" />
      default:
        return <FiActivity className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.12),transparent)] dark:bg-gray-950 dark:text-gray-100 dark:bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.45),transparent)]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !triage) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.12),transparent)] dark:bg-gray-950 dark:text-gray-100 dark:bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.45),transparent)]">
        <div className="p-6">
          <button
            onClick={() => navigate('/records')}
            className="flex items-center gap-2 text-teal-400 hover:text-teal-300 mb-6"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Records
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Error</h1>
            <p className="text-gray-300">{error || 'Triage record not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.12),transparent)] dark:bg-gray-950 dark:text-gray-100 dark:bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.45),transparent)]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/records')}
            className="flex items-center gap-2 text-teal-400 hover:text-teal-300"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Records
          </button>
          <div>
            <h1 className="text-2xl font-bold">Triage Assessment</h1>
            <p className="text-gray-400">
              {triage.created_at ? new Date(triage.created_at).toLocaleDateString() : 'Unknown date'}
            </p>
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FiUser className="w-5 h-5" />
            Patient Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {triage.name && (
              <div>
                <label className="text-sm text-gray-400">Name</label>
                <p className="text-lg font-medium text-teal-300">{triage.name}</p>
              </div>
            )}
            {triage.age && (
              <div>
                <label className="text-sm text-gray-400">Age</label>
                <p className="text-lg font-medium">{triage.age} years</p>
              </div>
            )}
            {triage.gender && (
              <div>
                <label className="text-sm text-gray-400">Gender</label>
                <p className="text-lg font-medium capitalize">{triage.gender}</p>
              </div>
            )}
          </div>
        </div>

        {/* Symptoms */}
        {triage.symptoms && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiActivity className="w-5 h-5" />
              Symptoms Reported
            </h2>
            <p className="text-gray-300 whitespace-pre-wrap">{triage.symptoms}</p>
          </div>
        )}

        {/* Assessment */}
        {triage.summary && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiAlertTriangle className="w-5 h-5" />
              Assessment Summary
            </h2>
            <p className="text-gray-300 whitespace-pre-wrap">{triage.summary}</p>
          </div>
        )}

        {/* Urgency Level */}
        {triage.urgency && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {getUrgencyIcon(triage.urgency)}
              Urgency Level
            </h2>
            <div className={`inline-block px-4 py-2 rounded-lg font-medium border ${getUrgencyColor(triage.urgency)}`}>
              {triage.urgency.toUpperCase()}
            </div>
          </div>
        )}

        {/* Disease Category */}
        {triage.disease_category && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Possible Condition</h2>
            <div className="inline-block bg-teal-500/20 text-teal-300 px-4 py-2 rounded-lg font-medium">
              {triage.disease_category}
            </div>
          </div>
        )}

        {/* Possible Conditions */}
        {triage.possible_conditions && triage.possible_conditions.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Possible Conditions</h2>
            <div className="space-y-2">
              {triage.possible_conditions.map((condition, index) => (
                <div key={index} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                  <span className="text-gray-300">{condition.name}</span>
                  <span className="text-teal-400 font-medium">
                    {Math.round(condition.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Red Flags */}
        {triage.red_flags && triage.red_flags.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-400">
              <FiAlertTriangle className="w-5 h-5" />
              Red Flags
            </h2>
            <ul className="space-y-2">
              {triage.red_flags.map((flag, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-red-300">{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vitals */}
        {triage.vitals && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiThermometer className="w-5 h-5" />
              Vital Signs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {triage.vitals.temperature && (
                <div className="flex items-center gap-2">
                  <FiThermometer className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-300">Temperature: {triage.vitals.temperature}</span>
                </div>
              )}
              {triage.vitals.heartRate && (
                <div className="flex items-center gap-2">
                  <FiHeart className="w-4 h-4 text-red-400" />
                  <span className="text-gray-300">Heart Rate: {triage.vitals.heartRate}</span>
                </div>
              )}
              {triage.vitals.bloodPressure && (
                <div className="flex items-center gap-2">
                  <FiActivity className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Blood Pressure: {triage.vitals.bloodPressure}</span>
                </div>
              )}
              {triage.vitals.oxygenSaturation && (
                <div className="flex items-center gap-2">
                  <FiDroplet className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-300">Oxygen Saturation: {triage.vitals.oxygenSaturation}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommended Action */}
        {triage.recommended_action && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5" />
              Recommended Action
            </h2>
            <p className="text-gray-300 mb-3">{triage.recommended_action}</p>
            {triage.recommended_action_reason && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-300 text-sm">
                  <strong>Reason:</strong> {triage.recommended_action_reason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instant Remedies */}
        {triage.instant_remedies && triage.instant_remedies.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiHeart className="w-5 h-5" />
              Instant Remedies
            </h2>
            <ul className="space-y-2">
              {triage.instant_remedies.map((remedy, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-300">{remedy}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Actions */}
        {triage.recommended_actions && triage.recommended_actions.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5" />
              Recommended Actions
            </h2>
            <ul className="space-y-2">
              {triage.recommended_actions.map((action, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-300">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>This assessment is for informational purposes only and should not replace professional medical advice.</p>
          <p className="mt-2">If you have concerns about your health, please consult with a healthcare professional.</p>
        </div>
      </div>
    </div>
  )
}
