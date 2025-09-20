import { useLocation, useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import type { ReportAnalysis } from '../lib/report-analysis.schema'

export default function SymptomsReportPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state || {}) as { analysis?: ReportAnalysis }
  const analysis = state.analysis

  if (!analysis) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/symptoms')}
          className="inline-flex items-center gap-2 text-teal-300 hover:text-teal-200"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Symptoms
        </button>
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-300">
          No report analysis found. Please upload a report again.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/symptoms')}
        className="inline-flex items-center gap-2 text-teal-300 hover:text-teal-200"
      >
        <FiArrowLeft className="w-4 h-4" /> Back to Symptoms
      </button>

      {/* We re-use the same layout as before, but simplified since it's a dedicated page */}
      <h2 className="text-2xl font-bold text-white">Report Analysis</h2>
      <div className="text-gray-400 text-sm">Type: {analysis.reportType}</div>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 space-y-4">
        <div className="text-white">{analysis.summary}</div>

        {Array.isArray(analysis.keyFindings) && analysis.keyFindings.length > 0 && (
          <div>
            <div className="text-white font-semibold mb-2">Key Findings</div>
            <ul className="list-disc pl-5 text-gray-200 space-y-1">
              {analysis.keyFindings.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(analysis.precautions) && analysis.precautions.length > 0 && (
          <div>
            <div className="text-yellow-300 font-semibold mb-2">Precautions</div>
            <ul className="list-disc pl-5 text-yellow-200 space-y-1">
              {analysis.precautions.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(analysis.dietRecommendations) && analysis.dietRecommendations.length > 0 && (
          <div>
            <div className="text-white font-semibold mb-2">Diet Recommendations</div>
            <ul className="list-disc pl-5 text-gray-200 space-y-1">
              {analysis.dietRecommendations.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(analysis.followUpActions) && analysis.followUpActions.length > 0 && (
          <div>
            <div className="text-white font-semibold mb-2">Follow-up Actions</div>
            <ul className="list-disc pl-5 text-gray-200 space-y-1">
              {analysis.followUpActions.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}


