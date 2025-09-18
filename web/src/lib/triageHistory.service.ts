import { supabase } from './supabaseClient'

export type TriageHistory = {
  id: string
  age?: number
  gender?: string
  symptoms?: string
  description?: string
  disease_category?: string
  summary?: string
  instant_remedies?: string[] | null
  recommended_actions?: string[] | null
  created_at?: string
}

// Force the correct table name - hardcoded to avoid caching issues
const TRIAGE_TABLE = 'triage_History'

// Debug logging with timestamp to force refresh
console.log('=== TriageHistoryService INIT ===', new Date().toISOString())
console.log('TriageHistoryService using table:', TRIAGE_TABLE)
console.log('Environment VITE_TRIAGE_TABLE:', (import.meta as any).env?.VITE_TRIAGE_TABLE)
console.log('Current URL:', window.location.href)

export class TriageHistoryService {
  static async create(entry: Partial<TriageHistory>): Promise<TriageHistory> {
    const fullPayload: any = {
      id: crypto.randomUUID(),
      age: entry.age ?? null,
      gender: entry.gender ?? null,
      symptoms: entry.symptoms ?? null,
      description: entry.description ?? null,
      disease_category: entry.disease_category ?? null,
      summary: entry.summary ?? null,
      instant_remedies: Array.isArray(entry.instant_remedies)
        ? JSON.stringify(entry.instant_remedies)
        : entry.instant_remedies ?? null,
      recommended_actions: Array.isArray(entry.recommended_actions)
        ? JSON.stringify(entry.recommended_actions)
        : entry.recommended_actions ?? null,
    }

    const minimalPayload: any = {
      id: fullPayload.id,
      age: fullPayload.age,
      gender: fullPayload.gender,
      symptoms: fullPayload.symptoms,
      description: fullPayload.description,
      disease_category: fullPayload.disease_category,
      summary: fullPayload.summary,
    }

    let data: any | null = null
    let error: any | null = null
    try {
      const res = await supabase
        .from(TRIAGE_TABLE)
        .insert(fullPayload)
        .select('*')
        .single()
      data = res.data
      error = res.error
    } catch (e) {
      error = e
    }
    if (error) {
      const res = await supabase
        .from(TRIAGE_TABLE)
        .insert(minimalPayload)
        .select('*')
        .single()
      if (res.error) throw res.error
      data = res.data
    }
    // Attempt to parse JSON strings back to arrays for the UI
    const row: any = data
    for (const key of ['instant_remedies', 'recommended_actions']) {
      const val = row[key]
      if (typeof val === 'string') {
        try { row[key] = JSON.parse(val) } catch { /* ignore */ }
      }
    }
    return row as TriageHistory
  }

  static async update(id: string, entry: Partial<TriageHistory>): Promise<TriageHistory> {
    const fullPayload: any = {
      age: entry.age ?? null,
      gender: entry.gender ?? null,
      symptoms: entry.symptoms ?? null,
      description: entry.description ?? null,
      disease_category: entry.disease_category ?? null,
      summary: entry.summary ?? null,
      instant_remedies: Array.isArray(entry.instant_remedies)
        ? JSON.stringify(entry.instant_remedies)
        : entry.instant_remedies ?? null,
      recommended_actions: Array.isArray(entry.recommended_actions)
        ? JSON.stringify(entry.recommended_actions)
        : entry.recommended_actions ?? null,
    }

    const minimalPayload: any = {
      age: fullPayload.age,
      gender: fullPayload.gender,
      symptoms: fullPayload.symptoms,
      description: fullPayload.description,
      disease_category: fullPayload.disease_category,
      summary: fullPayload.summary,
    }

    let data: any | null = null
    let error: any | null = null
    try {
      const res = await supabase
        .from(TRIAGE_TABLE)
        .update(fullPayload)
        .eq('id', id)
        .select('*')
        .single()
      data = res.data
      error = res.error
    } catch (e) {
      error = e
    }
    if (error) {
      const res = await supabase
        .from(TRIAGE_TABLE)
        .update(minimalPayload)
        .eq('id', id)
        .select('*')
        .single()
      if (res.error) throw res.error
      data = res.data
    }
    const row: any = data
    for (const key of ['instant_remedies', 'recommended_actions']) {
      const val = row[key]
      if (typeof val === 'string') {
        try { row[key] = JSON.parse(val) } catch { /* ignore */ }
      }
    }
    return row as TriageHistory
  }

  static async list(): Promise<TriageHistory[]> {
    console.log('TriageHistoryService.list() called with table:', TRIAGE_TABLE)
    console.log('Supabase client configured:', !!supabase)
    
    // Force clear any cached references
    const tableName = 'triage_History'
    console.log('Using hardcoded table name:', tableName)
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('TriageHistoryService.list() error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw error
    }
    console.log('TriageHistoryService.list() success, data count:', data?.length || 0)
    const rows = (data as any[]) || []
    return rows.map((row) => {
      const out = { ...row }
      for (const key of ['instant_remedies', 'recommended_actions']) {
        const val = out[key]
        if (typeof val === 'string') {
          try { out[key] = JSON.parse(val) } catch { /* ignore */ }
        }
      }
      return out as TriageHistory
    })
  }
}
