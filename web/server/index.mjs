import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

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
      
      // Store triage history in database
      if (supabase) {
        try {
          console.log('[api] Storing triage history in table:', TRIAGE_TABLE)
          const generateShortId = () => Math.random().toString(36).slice(2, 9)
          const triageData = {
            id: generateShortId(),
            username: username || null,
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
            instant_remedies: validated.instantRemedies ? JSON.stringify(validated.instantRemedies) : null,
            recommended_actions: validated.followUps ? JSON.stringify(validated.followUps) : null,
            red_flags: validated.redFlags ? JSON.stringify(validated.redFlags) : null,
            possible_conditions: validated.possibleConditions ? JSON.stringify(validated.possibleConditions) : null,
            vitals: validated.vitals ? JSON.stringify(validated.vitals) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          
          const { data, error } = await supabase
            .from(TRIAGE_TABLE)
            .insert(triageData)
            .select('*')
            .single()
          
          if (error) {
            console.error('[api] Supabase error:', error)
          } else {
            console.log('[api] Triage history stored successfully:', data?.id)
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

const PORT = process.env.PORT || 8787
app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`)
})


