import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TriageService } from '../lib/triage.service';
import type { TriageRequest } from '../lib/triage.service';
import { type TriageReport } from '../lib/triage.schema';
import { FiActivity, FiClock, FiAlertTriangle, FiCheckCircle, FiHeart, FiThermometer, FiDroplet, FiPhone } from 'react-icons/fi';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../state/AuthContext';

export default function TriageBot() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | 'unknown'>('unknown');
  const [report, setReport] = useState<TriageReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askedFollowUp, setAskedFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePayload, setImagePayload] = useState<{ mimeType: string; data: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event: any) => {
        const transcript: string = Array.from(event.results)
          .map((r: any) => r[0]?.transcript || '')
          .join(' ')
          .trim();
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoice = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      setError(t('errors.voiceNotSupported'));
      return;
    }
    if (isListening) {
      try { rec.stop(); } catch {}
      setIsListening(false);
    } else {
      setError(null);
      try { rec.start(); setIsListening(true); } catch {}
    }
  };

  const buildFollowUpIfNeeded = (text: string): { needed: boolean; question: string } => {
    const t = (text || '').toLowerCase().trim();
    const words = t.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const hasDuration = /(for|since)\s+\d+\s*(hour|hours|day|days|week|weeks)/i.test(text) || /\b(\d+)\s*(h|hr|hrs|d|w)\b/i.test(text);
    const hasLocation = /(head|throat|chest|back|stomach|abdomen|leg|arm|shoulder|knee|ear|eye|tooth|neck|lower back|upper back)/i.test(text);
    const hasSeverity = /(mild|moderate|severe|worst|pain\s*scale|out of 10)/i.test(text);
    const hasSymptomKeyword = /(pain|ache|hurts|sore|fever|cough|vomit|nausea|diarrhea|dizzy|headache|cold|flu)/i.test(text);

    // Ask only when extremely mandatory:
    // - Very short input OR
    // - No duration, no location, no severity AND no recognizable symptom keyword
    const extremelyVague = (!hasDuration && !hasLocation && !hasSeverity && !hasSymptomKeyword);
    if (wordCount < 5 || extremelyVague) {
      return { needed: true, question: 'Which part is most affected?' };
    }
    return { needed: false, question: '' };
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      // One-time follow-up flow
      if (!askedFollowUp) {
        const f = buildFollowUpIfNeeded(input);
        if (f.needed) {
          setAskedFollowUp(true);
          setFollowUpQuestion(f.question);
          setLoading(false);
          return;
        }
      }

      const combinedTranscript = askedFollowUp && followUpAnswer.trim()
        ? `${input}\nFollow-up answer: ${followUpAnswer.trim()}`
        : input;

      const shortId = Math.random().toString(36).slice(2, 9);
      const request: TriageRequest = {
        patientId: shortId,
        transcript: combinedTranscript,
        name: name.trim() || undefined,
        age: parseInt(age, 10) || undefined,
        sex: sex,
        username: user?.username,
        image: imagePayload || undefined,
      };

      const result = await TriageService.analyzeSymptoms(request);
      setReport(result);
      // Reset follow-up state after submission
      setAskedFollowUp(false);
      setFollowUpQuestion('');
      setFollowUpAnswer('');
      // keep image after submit so user sees preview alongside report
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
        {/* Name Input */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

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
        <div className="relative">
          <label htmlFor="symptoms" className="block text-sm font-medium text-gray-200 mb-2">
            {t('consultation.describeSymptoms')}
          </label>
          <textarea
            id="symptoms"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 pr-12 pl-12 pb-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            rows={4}
            placeholder={t('consultation.symptomsPlaceholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {/* Plus button - bottom-left */}
          <button
            type="button"
            aria-label={t('consultation.addImage')}
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 left-3 w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 5v14m7-7H5"/></svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const result = String(reader.result || '');
                const base64 = result.split(',')[1] || '';
                setImagePreview(result);
                setImagePayload({ mimeType: file.type, data: base64 });
              };
              reader.readAsDataURL(file);
            }}
          />
          {/* Mic button - bottom-right */}
          <button
            type="button"
            aria-label={t('consultation.voiceInput')}
            onClick={toggleVoice}
            className={`absolute bottom-3 right-3 w-9 h-9 rounded-full border text-white flex items-center justify-center ${isListening ? 'bg-red-500/80 border-red-500' : 'bg-white/10 hover:bg-white/15 border-white/20'}`}
          >
            {isListening ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 animate-pulse"><path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3zm-7-3a7 7 0 0 0 14 0h-2a5 5 0 0 1-10 0H5z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3zm-7-3a7 7 0 0 0 14 0h-2a5 5 0 0 1-10 0H5z"/></svg>
            )}
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
        disabled={loading || !input.trim() || (askedFollowUp && !followUpAnswer.trim())}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('consultation.analyzing')}
            </>
          ) : (
            <>
              <FiActivity className="w-4 h-4" />
            {askedFollowUp ? t('consultation.submitFollowUp') : t('consultation.analyzeButton')}
            </>
          )}
        </button>
      </div>

      {/* Image attach */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">You can attach an image of the affected area.</div>
        <label className="inline-flex items-center gap-2 text-xs text-teal-300 hover:text-teal-200 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const result = String(reader.result || '');
                const base64 = result.split(',')[1] || '';
                setImagePreview(result);
                setImagePayload({ mimeType: file.type, data: base64 });
              };
              reader.readAsDataURL(file);
            }}
          />
          <span className="inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 5v14m7-7H5"/></svg>
            Add image
          </span>
        </label>
      </div>

      {/* Image preview pinned bottom-right of input card */}
      {imagePreview && (
        <div className="fixed bottom-6 right-6 bg-black/50 border border-white/20 rounded-lg p-2 shadow-lg z-[55]">
          <div className="text-[10px] text-gray-300 mb-1">Attached image</div>
          <img src={imagePreview} alt="attachment preview" className="w-24 h-24 object-cover rounded" />
        </div>
      )}

      {/* Follow-up Question (one-time) */}
      {askedFollowUp && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
          <div className="text-sm text-blue-200">{followUpQuestion}</div>
          <input
            type="text"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Type a short answer"
            value={followUpAnswer}
            onChange={(e) => setFollowUpAnswer(e.target.value)}
          />
          <p className="text-xs text-blue-300">We ask just one quick question to better understand your issue.</p>
        </div>
      )}

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
            {/* Likely condition highlight */}
            {Array.isArray(report.possibleConditions) && report.possibleConditions.length > 0 && report.possibleConditions[0]?.name && (
              <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-3 col-span-2">
                <div className="text-teal-300 text-xs uppercase tracking-wide">Likely condition</div>
                <div className="text-white font-semibold flex items-center gap-2">
                  <span>{report.possibleConditions[0].name}</span>
                  {typeof report.possibleConditions[0].confidence === 'number' && (
                    <span className="text-xs text-teal-300">({Math.round(report.possibleConditions[0].confidence * 100)}%)</span>
                  )}
                </div>
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