// lib/triage.schema.ts
import { z } from "zod";

export const TriageReportSchema = z.object({
  patientId: z.string(),
  triageDate: z.string(),
  age: z.number().int().min(0).max(120).optional(),
  sex: z.enum(["female", "male", "other", "unknown"]).optional(),

  vitals: z
    .object({
      temperature: z.string().optional(), // e.g., "38.5 C" or "101.3 F"
      heartRate: z.string().optional(), // e.g., "80 bpm"
      bloodPressure: z.string().optional(), // e.g., "120/80 mmHg"
      oxygenSaturation: z.string().optional(), // e.g., "98%"
    })
    .optional(),

  symptoms: z
    .array(
      z.object({
        name: z.string(),
        onset: z.string().optional(), // e.g., "3 days"
        severity: z.enum(["mild", "moderate", "severe"]).optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),

  redFlags: z.array(z.string()).optional(),

  possibleConditions: z
    .array(
      z.object({
        name: z.string(),
        confidence: z.number().min(0).max(1),
      })
    )
    .max(5)
    .optional(),

  urgency: z.enum(["low", "medium", "high"]),

  recommendedAction: z.string(),
  recommendedActionReason: z.string().optional(),
  instantRemedies: z.array(z.string()).optional(),
  followUps: z.array(z.string()).optional(),

  summaryForDoctor: z.string(),

  disclaimers: z.array(z.string()),
});

export type TriageReport = z.infer<typeof TriageReportSchema>;
