import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportAnalysisService } from '../lib/report-analysis.service';
import type { ReportAnalysisRequest } from '../lib/report-analysis.service';
import { type ReportAnalysis } from '../lib/report-analysis.schema';
import { FiUpload, FiFileText, FiAlertTriangle, FiCheckCircle, FiClock, FiHeart, FiActivity, FiPhone, FiX } from 'react-icons/fi';
import { useAuth } from '../state/AuthContext';

export default function ReportAnalysis() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'male' | 'female' | 'other' | 'unknown'>('unknown');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePayload, setImagePayload] = useState<{ mimeType: string; data: string } | null>(null);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImage && !isPdf) {
      setError('Please upload an image (JPG/PNG) or PDF file.');
      return;
    }

    // Validate file size (max 20MB before compression)
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB');
      return;
    }

    try {
      setError(null);
      
      if (isPdf) {
        // For PDFs, read as base64 without compression
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(String(reader.result || ''));
          reader.readAsDataURL(file);
        });
        const base64 = dataUrl.split(',')[1] || '';
        setImagePreview(null); // no image preview for PDF
        setImagePayload({ mimeType: 'application/pdf', data: base64 });
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        console.log(`PDF loaded: ${originalSize}MB`);
      } else {
        // Images: compress if large
        let compressedDataUrl: string;
        if (file.size > 2 * 1024 * 1024) {
          compressedDataUrl = await compressImage(file, 1920, 0.7);
        } else {
          const reader = new FileReader();
          compressedDataUrl = await new Promise((resolve) => {
            reader.onload = () => resolve(String(reader.result || ''));
            reader.readAsDataURL(file);
          });
        }
        const base64 = compressedDataUrl.split(',')[1] || '';
        setImagePreview(compressedDataUrl);
        setImagePayload({ mimeType: 'image/jpeg', data: base64 });
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (base64.length * 0.75 / 1024 / 1024).toFixed(2);
        console.log(`Image compressed: ${originalSize}MB → ${compressedSize}MB`);
      }

    } catch (err) {
      setError('Failed to process image. Please try a different file.');
      console.error('Image processing error:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!imagePayload) {
      setError('Please upload a medical report image first');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const reportId = Math.random().toString(36).slice(2, 9);
      const request: ReportAnalysisRequest = {
        reportId,
        image: imagePayload,
        patientName: patientName.trim() || undefined,
        patientAge: parseInt(patientAge, 10) || undefined,
        patientGender,
        username: user?.username,
      };

      const result = await ReportAnalysisService.analyzeReport(request);
      setAnalysis(result);
      // Provide a button below to view detailed report on a separate page
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImagePayload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-400';
      case 'abnormal':
        return 'text-yellow-400';
      case 'normal':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Medical Report Analysis</h2>
        <p className="text-gray-300 text-sm">Upload your medical report for AI-powered analysis and recommendations</p>
      </div>

      {/* Form */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-6 space-y-4">
        {/* Patient Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-200 mb-2">
              Patient Name (Optional)
            </label>
            <input
              type="text"
              id="patientName"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter patient name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="patientAge" className="block text-sm font-medium text-gray-200 mb-2">
              Age (Optional)
            </label>
            <input
              type="number"
              id="patientAge"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter age"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="patientGender" className="block text-sm font-medium text-gray-200 mb-2">
              Gender (Optional)
            </label>
            <select
              id="patientGender"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              value={patientGender}
              onChange={(e) => setPatientGender(e.target.value as any)}
            >
              <option value="unknown" className="bg-gray-800">Prefer not to say</option>
              <option value="male" className="bg-gray-800">Male</option>
              <option value="female" className="bg-gray-800">Female</option>
              <option value="other" className="bg-gray-800">Other</option>
            </select>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Upload Medical Report
          </label>
          <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-teal-500/50 transition-colors">
            {imagePreview ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Report preview"
                    className="max-w-full max-h-64 rounded-lg shadow-lg"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-300">Report uploaded successfully</p>
              </div>
            ) : (
              <div className="space-y-4">
                <FiUpload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-white font-medium">Click to upload or drag and drop</p>
                  <p className="text-gray-400 text-sm">Supports JPG, PNG, PDF (max 20MB; images auto-compressed)</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Choose File
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !imagePayload}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing Report...
            </>
          ) : (
            <>
              <FiFileText className="w-4 h-4" />
              Analyze Report
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

      {/* Results are now shown on a separate page */}
      {analysis && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl ring-1 ring-white/20 p-4 text-gray-300">
          Analysis ready. Click below to view the full report.
        </div>
      )}

      <button
        onClick={() => analysis && navigate('/symptoms/report', { state: { analysis } })}
        disabled={!analysis}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
      >
        Check Report
      </button>
    </div>
  );
}
