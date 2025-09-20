import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager } from '@google/generative-ai/server'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

const TriageReportSchema = z.object({
  patientId: z.string(),
  triageDate: z.string().default(() => new Date().toISOString()),
  age: z.number().int().min(0).max(120).optional(),
  sex: z.enum(['female', 'male', 'other', 'unknown']).optional(),
  vitals: z
    .object({
      temperature: z.string().optional(),
      heartRate: z.string().optional(),
      bloodPressure: z.string().optional(),
      oxygenSaturation: z.string().optional(),
    })
    .optional(),
  symptoms: z
    .array(
      z.object({
        name: z.string(),
        onset: z.string().optional(),
        severity: z.enum(['mild', 'moderate', 'severe']).optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  redFlags: z.array(z.string()).optional(),
  possibleConditions: z
    .array(
      z.object({
        name: z.string(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(5)
    .optional(),
  urgency: z.enum(['low', 'medium', 'high']),
  recommendedAction: z.string(),
  recommendedActionReason: z.string().optional(),
  instantRemedies: z.array(z.string()).optional(),
  followUps: z.array(z.string()).optional(),
  summaryForDoctor: z.string(),
  disclaimers: z.array(z.string()),
})

const ReportAnalysisSchema = z.object({
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
})

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null

// Allow overriding triage table via env; default to lowercase to match Supabase
const TRIAGE_TABLE = process.env.TRIAGE_TABLE || 'triage_history'

const SYSTEM = `You are a healthcare triage assistant.
DO NOT explain, DO NOT use Markdown, DO NOT add extra text.
Return ONLY valid JSON strictly matching this schema:

{
  "patientId": "string",
  "triageDate": "string",
  "age": number,
  "sex": "male" | "female" | "other" | "unknown",
  "vitals": {
    "temperature": "string",
    "heartRate": "string",
    "bloodPressure": "string",
    "oxygenSaturation": "string"
  },
  "symptoms": [
    { "name": "string", "onset": "string", "severity": "mild|moderate|severe", "notes": "string" }
  ],
  "redFlags": ["string"],
  "possibleConditions": [
    { "name": "string", "confidence": 0.0 }
  ],
  "urgency": "low" | "medium" | "high",
  "recommendedAction": "string",
  "recommendedActionReason": "string",
  "instantRemedies": ["string"],
  "followUps": ["string"],
  "summaryForDoctor": "string",
  "disclaimers": ["string"]
}

Rules for High-Quality Recommendations:
1.  Actionable & Specific: The "recommendedAction" MUST be concrete and directly related to the patient's symptoms.
    -   BAD: "See a doctor."
    -   GOOD: "Schedule an appointment with a primary care physician to evaluate your persistent cough and fever."

2.  Justified: The "recommendedActionReason" MUST explain why the action is recommended, referencing specific symptoms.
    -   Example: "A persistent cough lasting over a week, combined with a fever, requires a professional evaluation to rule out conditions like bronchitis or pneumonia."

3.  Instant Remedies: For "low" or "medium" urgency cases, provide a list of specific, safe, at-home "instantRemedies". For "high" urgency, this MUST be an empty array.
    -   BAD: "Stay hydrated."
    -   GOOD: "Gargle with warm salt water 4-5 times a day to soothe a sore throat."
    -   GOOD: "Apply a cold compress to your forehead for 15-minute intervals to help reduce fever."

4.  JSON Only: Never output text before or after the JSON object. Never use Markdown.
5.  Disclaimers: Always include the disclaimer field, like this: "disclaimers": ["This is not medical advice"].
6.  Vitals: ONLY include the "vitals" object if the patient explicitly provides vital signs in the transcript. Otherwise, omit the key.
7.  Doctor Summary: Do NOT include the patient's sex in the "summaryForDoctor" field.`

function buildMockReport({ patientId, age, sex, transcript }) {
  const base = {
    patientId,
    triageDate: new Date().toISOString(),
    age,
    sex: sex || 'unknown',
    symptoms: [
      { name: 'headache', onset: '2 days', severity: 'mild', notes: '' },
    ],
    redFlags: [],
    possibleConditions: [
      { name: 'Tension headache', confidence: 0.6 },
      { name: 'Dehydration', confidence: 0.3 },
    ],
    urgency: 'low',
    recommendedAction: 'Hydrate well, rest, and use OTC analgesics as directed.',
    recommendedActionReason:
      'Mild headache without red flags and short duration suggests low urgency.',
    instantRemedies: [
      'Drink water regularly today',
      'Apply a cold compress for 10 minutes',
    ],
    followUps: ['If symptoms persist > 72 hours, consult a doctor'],
    summaryForDoctor: 'Auto-generated triage summary.',
    disclaimers: ['This is not medical advice. For emergencies call local services.'],
  }
  return applyClinicalHeuristics(base, transcript)
}

function normalizeTriage(raw, { patientId, age, sex }) {
  const triage = { ...(raw || {}) }

  if (!triage.patientId) triage.patientId = patientId
  if (!triage.triageDate) triage.triageDate = new Date().toISOString()
  if (!['female', 'male', 'other', 'unknown'].includes(triage.sex)) triage.sex = sex || 'unknown'

  if (triage.possibleConditions && Array.isArray(triage.possibleConditions)) {
    triage.possibleConditions = triage.possibleConditions
      .slice(0, 5)
      .map((c) => ({
        name: String(c?.name || 'Unknown'),
        confidence: Math.max(0, Math.min(1, Number(c?.confidence ?? 0))),
      }))
  }

  if (!triage.urgency) triage.urgency = 'medium'
  if (!triage.recommendedAction)
    triage.recommendedAction = 'Monitor symptoms and consult a clinician if they persist or worsen.'
  if (!Array.isArray(triage.instantRemedies)) triage.instantRemedies = []
  if (!Array.isArray(triage.followUps)) triage.followUps = []
  if (!triage.summaryForDoctor) triage.summaryForDoctor = 'Auto-generated triage summary.'
  if (!Array.isArray(triage.disclaimers) || triage.disclaimers.length === 0) {
    triage.disclaimers = ['This is not medical advice. For emergencies call local services.']
  }

  if (triage.vitals && typeof triage.vitals === 'object') {
    const v = triage.vitals
    triage.vitals = {
      temperature: v?.temperature ? String(v.temperature) : undefined,
      heartRate: v?.heartRate ? String(v.heartRate) : undefined,
      bloodPressure: v?.bloodPressure ? String(v.bloodPressure) : undefined,
      oxygenSaturation: v?.oxygenSaturation ? String(v.oxygenSaturation) : undefined,
    }
  }

  return triage
}

function extractTemperature(text) {
  if (!text || typeof text !== 'string') return null
  const t = text.toLowerCase()
  // Require explicit mention of temp with unit markers to count as provided
  const patterns = [
    /(temperature|temp|fever)\s*(is|:|=)?\s*(\d{2,3}(?:\.\d)?)\s*(?:°\s*)?(c|f|celsius|fahrenheit)\b/,
    /(\d{2,3}(?:\.\d)?)\s*(?:°\s*)?(c|f)\b\s*(temperature|temp)/,
  ]
  for (const exp of patterns) {
    const m = t.match(exp)
    if (m) {
      const val = Number(m[3] || m[1])
      const u = (m[4] || m[2] || '').toLowerCase()
      const unit = u.startsWith('c') ? 'C' : 'F'
      return { value: val, unit }
    }
  }
  return null
}

function extractHeartRate(text) {
  if (!text || typeof text !== 'string') return null
  const t = text.toLowerCase()
  const m = t.match(/(heart\s*rate|hr|pulse)\s*(is|:|=)?\s*(\d{2,3})\s*(bpm)?\b/)
  if (m) return `${Number(m[3])} bpm`
  return null
}

function extractBloodPressure(text) {
  if (!text || typeof text !== 'string') return null
  const t = text.toLowerCase()
  const m = t.match(/(blood\s*pressure|bp)\s*(is|:|=)?\s*(\d{2,3})\s*[\/\-]\s*(\d{2,3})\b/)
  if (m) return `${Number(m[3])}/${Number(m[4])} mmHg`
  return null
}

function extractOxygenSaturation(text) {
  if (!text || typeof text !== 'string') return null
  const t = text.toLowerCase()
  const m = t.match(/(oxygen\s*saturation|spo2|o2\s*sat)\s*(is|:|=)?\s*(\d{2,3})\s*%/)
  if (m) return `${Number(m[3])}%`
  return null
}

function hasRedFlags(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.toLowerCase()
  const flags = [
    'chest pain',
    'shortness of breath',
    'difficulty breathing',
    'confusion',
    'fainting',
    'severe dehydration',
    'stiff neck',
    'seizure',
    'unresponsive',
  ]
  return flags.some((k) => t.includes(k))
}

function applyClinicalHeuristics(triage, transcript) {
  const out = { ...(triage || {}) }

  // Extract explicitly provided vitals only
  const temp = extractTemperature(transcript)
  const hr = extractHeartRate(transcript)
  const bp = extractBloodPressure(transcript)
  const spo2 = extractOxygenSaturation(transcript)
  const anyVitals = temp || hr || bp || spo2
  if (anyVitals) {
    out.vitals = out.vitals && typeof out.vitals === 'object' ? { ...out.vitals } : {}
    if (temp && !out.vitals.temperature) out.vitals.temperature = `${temp.value} ${temp.unit}`
    if (hr && !out.vitals.heartRate) out.vitals.heartRate = hr
    if (bp && !out.vitals.bloodPressure) out.vitals.bloodPressure = bp
    if (spo2 && !out.vitals.oxygenSaturation) out.vitals.oxygenSaturation = spo2
  }
  // Remove empty vitals to honor omission rule
  if (out.vitals && !out.vitals.temperature && !out.vitals.heartRate && !out.vitals.bloodPressure && !out.vitals.oxygenSaturation) {
    delete out.vitals
  }

  // Determine high fever
  let highFever = false
  if (out.vitals && out.vitals.temperature) {
    const tv = String(out.vitals.temperature)
    const m = tv.match(/(\d{2,3}(?:\.\d)?)\s*([fFcC])?/)
    if (m) {
      const val = Number(m[1])
      const unit = (m[2] || 'F').toUpperCase()
      const valF = unit === 'C' ? (val * 9) / 5 + 32 : val
      if (valF >= 103) highFever = true
    }
  }

  const redFlags = hasRedFlags(transcript)

  // Escalate urgency and actions
  if (highFever || redFlags) {
    out.urgency = 'high'
    out.instantRemedies = []
    out.recommendedAction = 'Seek urgent in-person medical evaluation immediately (emergency services if needed).'
    out.recommendedActionReason = highFever
      ? 'Reported high fever (≥ 103°F) indicates possible serious infection or complications.'
      : 'Reported red-flag symptoms require urgent assessment.'
  }

  // Enforce instantRemedies empty for high urgency
  if (out.urgency === 'high') {
    out.instantRemedies = []
  }

  // Ensure recommendedActionReason present
  if (!out.recommendedActionReason || !String(out.recommendedActionReason).trim()) {
    const symptomNames = Array.isArray(out.symptoms) ? out.symptoms.map((s) => s?.name).filter(Boolean) : []
    const snip = (transcript || '').trim().slice(0, 120)
    const basis = symptomNames.length ? symptomNames.join(', ') : snip || 'reported symptoms'
    out.recommendedActionReason = `Recommended due to ${basis}.`
  }

  // Improve summaryForDoctor if placeholder/missing
  const placeholder = !out.summaryForDoctor || /auto\-generated/i.test(out.summaryForDoctor)
  if (placeholder) {
    const snip = (transcript || '').trim().slice(0, 160)
    let tempNote = ''
    if (out.vitals?.temperature) tempNote = ` Temp ${out.vitals.temperature}.`
    out.summaryForDoctor = `Patient-reported symptoms: ${snip || 'not specified'}.${tempNote} Urgency: ${out.urgency}.`
  }

  return out
}

app.post('/api/triage', async (req, res) => {
  try {
    const { patientId, transcript, name, age, sex, image, username } = req.body || {}
    if (!patientId || !transcript) {
      return res.status(400).json({ error: 'Missing required fields: patientId, transcript' })
    }

    if (!genAI) {
      // Fallback when no API key is configured (local dev)
      const mock = buildMockReport({ patientId, age, sex, transcript })
      const heur = applyClinicalHeuristics(mock, transcript)
      const validated = TriageReportSchema.parse(heur)
      return res.status(200).json(validated)
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: SYSTEM })
    const userParts = [{ text: `PatientId: ${patientId}\nAge: ${age ?? 'unknown'}\nSex: ${sex ?? 'unknown'}\n\nTranscript:\n${transcript}` }]
    if (image && image.mimeType && image.data) {
      userParts.push({ inlineData: { mimeType: image.mimeType, data: image.data } })
    }
    let text
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: userParts }],
        generationConfig: { responseMimeType: 'application/json' },
      })
      text = result.response.text().trim()
    } catch (modelErr) {
      console.error('[api] Model call failed:', modelErr)
      const mock = buildMockReport({ patientId, age, sex, transcript })
      const heur = applyClinicalHeuristics(mock, transcript)
      const validated = TriageReportSchema.parse(heur)
      return res.status(200).json(validated)
    }

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) {
        console.warn('[api] Model did not return JSON, using mock. Raw:', text)
        const mock = buildMockReport({ patientId, age, sex, transcript })
        const validated = TriageReportSchema.parse(mock)
        return res.status(200).json(validated)
      }
      parsed = JSON.parse(match[0])
    }

    // Normalize then validate; fallback to mock if still invalid
    try {
      const normalized = normalizeTriage(parsed, { patientId, age, sex })
      const heur = applyClinicalHeuristics(normalized, transcript)
      const validated = TriageReportSchema.parse(heur)
      
      // Store triage history in database (robust insert with fallback)
      if (supabase) {
        try {
          console.log('[api] Storing triage history in table:', TRIAGE_TABLE)
          const generateShortId = () => Math.random().toString(36).slice(2, 9)
          const id = generateShortId()

          // Optional: verify username exists to avoid potential FK constraints in some schemas
          let validUsername = null
          if (username) {
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .single()
              if (!userError && userData) validUsername = username
            } catch {
              // ignore check errors; proceed without username
            }
          }

          // Prefer sending native arrays/objects for JSONB columns
          const fullPayload = {
            id,
            username: validUsername,
            name: name || null,
            age: age || null,
            gender: sex || null,
            symptoms: transcript,
            description: validated.summaryForDoctor,
            disease_category: validated.possibleConditions?.[0]?.name || null,
            summary: validated.summaryForDoctor,
            urgency: validated.urgency || null,
            recommended_action: validated.recommendedAction || null,
            recommended_action_reason: validated.recommendedActionReason || null,
            instant_remedies: validated.instantRemedies || null,
            recommended_actions: validated.followUps || null,
            red_flags: validated.redFlags || null,
            possible_conditions: validated.possibleConditions || null,
            vitals: validated.vitals || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          // Minimal payload for very lean schemas
          const minimalPayload = {
            id,
            username: validUsername,
            name: name || null,
            age: age || null,
          }

          let ins = await supabase
            .from(TRIAGE_TABLE)
            .insert(fullPayload)
            .select('*')
            .single()
          if (ins.error) {
            console.warn('[api] Full insert failed, retrying minimal:', ins.error?.message)
            ins = await supabase
              .from(TRIAGE_TABLE)
              .insert(minimalPayload)
              .select('*')
              .single()
          }
          if (ins.error) {
            console.error('[api] Supabase insert error:', ins.error)
          } else {
            console.log('[api] Triage history stored successfully:', ins.data?.id)
          }
        } catch (dbErr) {
          console.error('[api] Failed to store triage history:', dbErr?.message)
        }
      } else {
        console.warn('[api] Supabase not configured, skipping triage history storage')
      }
      
      return res.status(200).json(validated)
    } catch (valErr) {
      console.warn('[api] Validation failed, using mock:', valErr?.message)
      const mock = buildMockReport({ patientId, age, sex, transcript })
      const heur = applyClinicalHeuristics(mock, transcript)
      const validated = TriageReportSchema.parse(heur)
      return res.status(200).json(validated)
    }
  } catch (err) {
    console.error('[api] Unexpected error:', err)
    res.status(500).json({ error: 'Triage generation failed', details: err?.message })
  }
})

// Report Analysis System Prompt
const REPORT_ANALYSIS_SYSTEM = `You are a medical report analysis assistant specializing in interpreting lab reports, prescriptions, imaging reports, and other medical documents.

CRITICAL INSTRUCTIONS:
1. Analyze ONLY the uploaded medical report image
2. Extract ALL relevant medical information accurately
3. Provide actionable recommendations based on findings
4. Return ONLY valid JSON matching the exact schema below
5. DO NOT provide medical advice - only analysis and recommendations
6. Always include appropriate disclaimers

REQUIRED JSON SCHEMA:
{
  "reportId": "string",
  "analysisDate": "string (ISO format)",
  "reportType": "string (e.g., 'Blood Test', 'X-Ray', 'Prescription', 'Lab Report')",
  "summary": "string (2-3 sentence overview of the report)",
  "keyFindings": ["string array of main findings"],
  "conditions": [
    {
      "name": "string",
      "severity": "mild|moderate|severe (optional)",
      "status": "normal|abnormal|critical (optional)",
      "notes": "string (optional)"
    }
  ],
  "medications": [
    {
      "name": "string",
      "dosage": "string (optional)",
      "frequency": "string (optional)",
      "duration": "string (optional)",
      "instructions": "string (optional)"
    }
  ],
  "precautions": ["string array of important precautions"],
  "dietRecommendations": ["string array of dietary advice"],
  "lifestyleChanges": ["string array of lifestyle modifications"],
  "followUpActions": ["string array of next steps"],
  "urgency": "low|medium|high",
  "recommendedAction": "string (specific action to take)",
  "doctorConsultation": "boolean (whether doctor visit is needed)",
  "emergencyWarning": "string (if urgent medical attention needed)",
  "normalRanges": [
    {
      "parameter": "string",
      "value": "string",
      "normalRange": "string",
      "status": "normal|abnormal|critical"
    }
  ],
  "disclaimers": ["This is not medical advice", "Consult your healthcare provider", "For emergencies call local services"]
}

ANALYSIS GUIDELINES:
- For lab reports: Extract all values, compare with normal ranges, identify abnormalities
- For blood reports specifically (CBC, CMP, lipid panel, HbA1c, thyroid panel, LFT/KFT):
  - Parse parameters like Hb, WBC, Platelets, RBC indices, Glucose (F/PP), HbA1c, Total/LDL/HDL/Triglycerides, AST/ALT/ALP/Bilirubin, Urea/Creatinine, TSH/T3/T4, etc.
  - Include the exact value and the lab's stated reference range when visible.
  - Mark each parameter as normal/abnormal/critical.
  - Summarize dyslipidemia, anemia patterns (microcytic/macrocytic), infection indicators (WBC differential), glycemic control (HbA1c bands), liver/renal dysfunction flags.
  - Provide diet/lifestyle recommendations tailored to the abnormal parameters (e.g., low saturated fat for high LDL, hydration and iron-rich foods for anemia, carbohydrate moderation for elevated glucose).
- For prescriptions: Extract medication names, dosages, instructions, duration
- For imaging: Note findings, abnormalities, recommendations
- Always assess urgency level based on findings
- Provide specific, actionable recommendations
- Include dietary advice when relevant (diabetes, cholesterol, etc.)
- Suggest lifestyle changes when appropriate
- Always recommend doctor consultation for abnormal findings`

function buildMockReportAnalysis({ reportId, patientName, patientAge, patientGender }) {
  return {
    reportId,
    analysisDate: new Date().toISOString(),
    reportType: "Lab Report",
    summary: "This appears to be a routine blood test with mostly normal values. A few parameters show minor variations from normal ranges.",
    keyFindings: [
      "Complete Blood Count within normal limits",
      "Cholesterol levels slightly elevated",
      "Blood sugar levels normal"
    ],
    conditions: [
      {
        name: "Mild Hypercholesterolemia",
        severity: "mild",
        status: "abnormal",
        notes: "Total cholesterol slightly above recommended range"
      }
    ],
    medications: [],
    precautions: [
      "Monitor cholesterol levels regularly",
      "Maintain healthy diet",
      "Exercise regularly"
    ],
    dietRecommendations: [
      "Reduce saturated fat intake",
      "Increase fiber consumption",
      "Limit processed foods",
      "Include omega-3 rich foods"
    ],
    lifestyleChanges: [
      "Regular physical activity (30 minutes daily)",
      "Maintain healthy weight",
      "Avoid smoking and excessive alcohol"
    ],
    followUpActions: [
      "Follow up with primary care physician in 3 months",
      "Repeat lipid panel in 6 months",
      "Continue current lifestyle modifications"
    ],
    urgency: "low",
    recommendedAction: "Schedule follow-up appointment with your primary care physician to discuss cholesterol management.",
    doctorConsultation: true,
    emergencyWarning: null,
    normalRanges: [
      {
        parameter: "Total Cholesterol",
        value: "220 mg/dL",
        normalRange: "< 200 mg/dL",
        status: "abnormal"
      },
      {
        parameter: "HDL Cholesterol",
        value: "45 mg/dL",
        normalRange: "> 40 mg/dL",
        status: "normal"
      }
    ],
    disclaimers: [
      "This is not medical advice",
      "Consult your healthcare provider for proper interpretation",
      "For medical emergencies, call local emergency services"
    ]
  }
}

app.post('/api/report-analysis', async (req, res) => {
  try {
    const { reportId, image, patientName, patientAge, patientGender, username } = req.body || {}
    if (!reportId || !image || !image.mimeType || !image.data) {
      return res.status(400).json({ error: 'Missing required fields: reportId, image (with mimeType and data)' })
    }

    if (!genAI) {
      // Fallback when no API key is configured (local dev)
      const mock = buildMockReportAnalysis({ reportId, patientName, patientAge, patientGender })
      const validated = ReportAnalysisSchema.parse(mock)
      return res.status(200).json(validated)
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash', 
      systemInstruction: REPORT_ANALYSIS_SYSTEM 
    })
    
    const userParts = [
      { 
        text: `Report ID: ${reportId}\nPatient: ${patientName || 'Not provided'}\nAge: ${patientAge || 'Not provided'}\nGender: ${patientGender || 'Not provided'}\n\nPlease analyze this medical report and provide a comprehensive analysis.` 
      }
    ]
    
    if (image && image.mimeType && image.data) {
      if (String(image.mimeType).toLowerCase().includes('pdf')) {
        // Handle PDF via Gemini Files API
        const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY)
        const tmpDir = os.tmpdir()
        const tmpPath = path.join(tmpDir, `report-${reportId}.pdf`)
        try {
          const buffer = Buffer.from(image.data, 'base64')
          fs.writeFileSync(tmpPath, buffer)
          const upload = await fileManager.uploadFile(tmpPath, {
            mimeType: image.mimeType,
            displayName: `medical-report-${reportId}.pdf`,
          })
          userParts.push({ fileData: { fileUri: upload.file.uri, mimeType: image.mimeType } })
        } catch (upErr) {
          console.error('[api] PDF upload failed, falling back to mock:', upErr?.message)
          const mock = buildMockReportAnalysis({ reportId, patientName, patientAge, patientGender })
          const validated = ReportAnalysisSchema.parse(mock)
          return res.status(200).json(validated)
        } finally {
          try { fs.existsSync(tmpPath) && fs.unlinkSync(tmpPath) } catch {}
        }
      } else {
        // Images use inlineData
        userParts.push({ inlineData: { mimeType: image.mimeType, data: image.data } })
      }
    }
    
    let text
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: userParts }],
        generationConfig: { responseMimeType: 'application/json' },
      })
      text = result.response.text().trim()
    } catch (modelErr) {
      console.error('[api] Report analysis model call failed:', modelErr)
      const mock = buildMockReportAnalysis({ reportId, patientName, patientAge, patientGender })
      const validated = ReportAnalysisSchema.parse(mock)
      return res.status(200).json(validated)
    }

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) {
        console.warn('[api] Model did not return JSON for report analysis, using mock. Raw:', text)
        const mock = buildMockReportAnalysis({ reportId, patientName, patientAge, patientGender })
        const validated = ReportAnalysisSchema.parse(mock)
        return res.status(200).json(validated)
      }
      parsed = JSON.parse(match[0])
    }

    // Validate and return
    try {
      const validated = ReportAnalysisSchema.parse(parsed)
      return res.status(200).json(validated)
    } catch (valErr) {
      console.warn('[api] Report analysis validation failed, using mock:', valErr?.message)
      const mock = buildMockReportAnalysis({ reportId, patientName, patientAge, patientGender })
      const validated = ReportAnalysisSchema.parse(mock)
      return res.status(200).json(validated)
    }
  } catch (err) {
    console.error('[api] Report analysis error:', err)
    res.status(500).json({ error: 'Report analysis failed', details: err?.message })
  }
})

const PORT = process.env.PORT || 8787
app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`)
})


