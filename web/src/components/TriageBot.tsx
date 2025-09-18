import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TriageService } from '../lib/triage.service';
import type { TriageRequest } from '../lib/triage.service';
import { type TriageReport } from '../lib/triage.schema';
import { FiActivity, FiClock, FiAlertTriangle, FiCheckCircle, FiHeart, FiThermometer, FiDroplet, FiPhone } from 'react-icons/fi';

export default function TriageBot() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | 'unknown'>('unknown');
  const [report, setReport] = useState<TriageReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const request: TriageRequest = {
        patientId: crypto.randomUUID(),
        transcript: input,
        age: parseInt(age, 10) || undefined,
        sex: sex,
      };

      const result = await TriageService.analyzeSymptoms(request);
      setReport(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConsultDoctor = () => {
    navigate('/video-consultation');
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <FiAlertTriangle className="w-5 h-5" />;
      case 'medium':
        return <FiClock className="w-5 h-5" />;
      case 'low':
        return <FiCheckCircle className="w-5 h-5" />;
      default:
        return <FiActivity className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Symptom Checker</h2>
        <p className="text-gray-300 text-sm">Describe your symptoms and get instant medical guidance</p>
      </div>

      {/* Form */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 space-y-4">
        {/* Age and Sex Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-200 mb-2">
              Age
            </label>
            <input
              type="number"
              id="age"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="sex" className="block text-sm font-medium text-gray-200 mb-2">
              Gender
            </label>
            <select
              id="sex"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              value={sex}
              onChange={(e) => setSex(e.target.value as any)}
            >
              <option value="unknown" className="bg-gray-800">Prefer not to say</option>
              <option value="male" className="bg-gray-800">Male</option>
              <option value="female" className="bg-gray-800">Female</option>
              <option value="other" className="bg-gray-800">Other</option>
            </select>
          </div>
        </div>

        {/* Symptoms Input */}
        <div>
          <label htmlFor="symptoms" className="block text-sm font-medium text-gray-200 mb-2">
            Describe your symptoms
          </label>
          <textarea
            id="symptoms"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="Example: I've had a fever for 3 days, sore throat, and body aches..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing Symptoms...
            </>
          ) : (
            <>
              <FiActivity className="w-4 h-4" />
              Analyze Symptoms
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-300">
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="w-5 h-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Report Display */}
      {report && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Triage Report</h3>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getUrgencyColor(report.urgency)}`}>
              {getUrgencyIcon(report.urgency)}
              <span className="font-medium capitalize">{report.urgency} Priority</span>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {report.age && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-gray-400">Age</div>
                <div className="text-white font-medium">{report.age} years</div>
              </div>
            )}
            {report.sex && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-gray-400">Gender</div>
                <div className="text-white font-medium capitalize">{report.sex}</div>
              </div>
            )}
          </div>

          {/* Recommended Action */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4" />
              Recommended Action
            </h4>
            <p className="text-gray-200">{report.recommendedAction}</p>
            {report.recommendedActionReason && (
              <p className="text-sm text-gray-400 mt-2 pl-4 border-l-2 border-teal-500/30">
                {report.recommendedActionReason}
              </p>
            )}
          </div>

          {/* Instant Remedies */}
          {report.instantRemedies && report.instantRemedies.length > 0 && (
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3">Instant Remedies</h4>
              <ul className="space-y-2">
                {report.instantRemedies.map((remedy, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-200">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{remedy}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vitals */}
          {report.vitals && (
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3">Vital Signs</h4>
              <div className="grid grid-cols-2 gap-3">
                {report.vitals.temperature && (
                  <div className="flex items-center gap-2 text-gray-200">
                    <FiThermometer className="w-4 h-4 text-red-400" />
                    <span className="text-sm">{report.vitals.temperature}</span>
                  </div>
                )}
                {report.vitals.heartRate && (
                  <div className="flex items-center gap-2 text-gray-200">
                    <FiHeart className="w-4 h-4 text-red-400" />
                    <span className="text-sm">{report.vitals.heartRate}</span>
                  </div>
                )}
                {report.vitals.bloodPressure && (
                  <div className="flex items-center gap-2 text-gray-200">
                    <FiActivity className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">{report.vitals.bloodPressure}</span>
                  </div>
                )}
                {report.vitals.oxygenSaturation && (
                  <div className="flex items-center gap-2 text-gray-200">
                    <FiDroplet className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">{report.vitals.oxygenSaturation}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Doctor Summary */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Summary for Doctor</h4>
            <p className="text-gray-200 text-sm">{report.summaryForDoctor}</p>
          </div>

          {/* Disclaimers */}
          {report.disclaimers && report.disclaimers.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-300 mb-2">Important Disclaimers</h4>
              <ul className="space-y-1">
                {report.disclaimers.map((disclaimer, index) => (
                  <li key={index} className="text-yellow-200 text-sm flex items-start gap-2">
                    <span className="w-1 h-1 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                    {disclaimer}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Consult Doctor Button */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleConsultDoctor}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <FiPhone className="w-5 h-5" />
              Consult Doctor via Video Call
            </button>
            <p className="text-center text-gray-400 text-xs mt-2">
              Connect with a medical professional for personalized consultation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}