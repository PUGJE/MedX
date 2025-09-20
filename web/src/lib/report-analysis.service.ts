// lib/report-analysis.service.ts
import { ReportAnalysisSchema, type ReportAnalysis } from './report-analysis.schema';

const REPORT_ANALYSIS_API_URL = '/api/report-analysis';

export interface ReportAnalysisRequest {
  reportId: string;
  image: {
    mimeType: string; // e.g., 'image/jpeg'
    data: string; // base64 data
  };
  patientName?: string;
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other' | 'unknown';
  username?: string;
}

export class ReportAnalysisService {
  static async analyzeReport(request: ReportAnalysisRequest): Promise<ReportAnalysis> {
    try {
      const response = await fetch(REPORT_ANALYSIS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      let data: unknown;
      if (!response.ok) {
        try {
          const errorData = await response.json();
          let errorMessage = errorData && (errorData.error || errorData.details);
          
          // Handle specific error cases
          if (response.status === 413) {
            errorMessage = 'File too large. Please compress your image or try a smaller file.';
          } else if (response.status === 400) {
            errorMessage = 'Invalid request. Please check your file and try again.';
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          
          throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
        } catch (e) {
          if (response.status === 413) {
            throw new Error('File too large. Please compress your image or try a smaller file.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        data = await response.json();
      }
      
      // Validate the response against our schema
      const validatedData = ReportAnalysisSchema.parse(data);
      return validatedData;
    } catch (error) {
      console.error('Report analysis failed:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to analyze report. Please try again.'
      );
    }
  }
}
