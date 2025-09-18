import { useState } from 'react';
import { TriageService } from '../lib/triage.service';

export default function TriageTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      const result = await TriageService.analyzeSymptoms({
        patientId: 'test-123',
        transcript: 'I have a mild headache and slight fever for 2 days',
        age: 25,
        sex: 'male'
      });
      
      setTestResult(`✅ Connection successful! Urgency: ${result.urgency}`);
    } catch (error: any) {
      setTestResult(`❌ Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-4">
      <h3 className="text-lg font-semibold text-white mb-3">TriageBot Test</h3>
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      {testResult && (
        <div className="mt-3 p-3 bg-white/5 rounded-lg">
          <p className="text-sm text-gray-200">{testResult}</p>
        </div>
      )}
    </div>
  );
}
