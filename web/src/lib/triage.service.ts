// lib/triage.service.ts
import { TriageReportSchema, type TriageReport } from './triage.schema';

const TRIAGE_API_URL = '/api/triage';

export interface TriageRequest {
  patientId: string;
  transcript: string;
  age?: number;
  sex?: 'male' | 'female' | 'other' | 'unknown';
  username?: string;
  image?: {
    mimeType: string; // e.g., 'image/jpeg'
    data: string; // base64 data
  };
}

export class TriageService {
  static async analyzeSymptoms(request: TriageRequest): Promise<TriageReport> {
    try {
      const response = await fetch(TRIAGE_API_URL, {
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
          throw new Error(
            (errorData && (errorData.error || errorData.details)) ||
              `HTTP error! status: ${response.status}`
          );
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        data = await response.json();
      }
      
      // Validate the response against our schema
      const validatedData = TriageReportSchema.parse(data);
      return validatedData;
    } catch (error) {
      console.error('Triage analysis failed:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to analyze symptoms. Please try again.'
      );
    }
  }
}