import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'

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

const SYSTEM = `You are a healthcare triage assistant. Return ONLY valid JSON matching this schema with fields described. No markdown, no extra text.`

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
  // Explicit F/C markers
  const exp = /(\d{2,3}(?:\.\d)?)\s*(?:°\s*)?([fc])/i
  const m = t.match(exp)
  if (m) {
    const val = Number(m[1])
    const unit = m[2] === 'c' ? 'C' : 'F'
    return { value: val, unit }
  }
  // Numbers without unit: infer by range
  const num = t.match(/\b(\d{2,3}(?:\.\d)?)\b/)
  if (num) {
    const val = Number(num[1])
    if (val >= 100 && val <= 110) return { value: val, unit: 'F' }
    if (val >= 38 && val <= 43) return { value: val, unit: 'C' }
  }
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

  // Extract or infer temperature
  const t = extractTemperature(transcript)
  if (!out.vitals) out.vitals = {}
  if (t && !out.vitals.temperature) {
    out.vitals.temperature = `${t.value} ${t.unit}`
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
    const { patientId, transcript, age, sex } = req.body || {}
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const prompt = `${SYSTEM}\n\nPatientId: ${patientId}\nAge: ${age ?? 'unknown'}\nSex: ${sex ?? 'unknown'}\n\nTranscript:\n${transcript}`
    let text
    try {
      const result = await model.generateContent(prompt)
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


