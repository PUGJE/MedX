// lib/report-analysis.schema.ts
import { z } from "zod";

export const ReportAnalysisSchema = z.object({
  reportId: z.string(),
  analysisDate: z.string(),
  
  // Report Summary
  reportType: z.string(), // e.g., "Blood Test", "X-Ray", "Prescription", "Lab Report"
  summary: z.string(),
  keyFindings: z.array(z.string()),
  
  // Medical Information
  conditions: z.array(z.object({
    name: z.string(),
    severity: z.enum(["mild", "moderate", "severe"]).optional(),
    status: z.enum(["normal", "abnormal", "critical"]).optional(),
    notes: z.string().optional(),
  })).optional(),
  
  // Medications
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    instructions: z.string().optional(),
  })).optional(),
  
  // Recommendations
  precautions: z.array(z.string()),
  dietRecommendations: z.array(z.string()).optional(),
  lifestyleChanges: z.array(z.string()).optional(),
  followUpActions: z.array(z.string()),
  
  // Urgency and Next Steps
  urgency: z.enum(["low", "medium", "high"]),
  recommendedAction: z.string(),
  doctorConsultation: z.boolean(),
  emergencyWarning: z.string().nullable().optional(),
  
  // Additional Information
  normalRanges: z.array(z.object({
    parameter: z.string(),
    value: z.string(),
    normalRange: z.string(),
    status: z.enum(["normal", "abnormal", "critical"]),
  })).optional(),
  
  disclaimers: z.array(z.string()),
});

export type ReportAnalysis = z.infer<typeof ReportAnalysisSchema>;
