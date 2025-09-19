import { supabase } from './supabaseClient'

export type TriageHistory = {
  id: string
  username?: string
  name?: string
  age?: number
  gender?: string
  symptoms?: string
  description?: string
  disease_category?: string
  summary?: string
  urgency?: string
  recommended_action?: string
  recommended_action_reason?: string
  instant_remedies?: string[] | null
  recommended_actions?: string[] | null
  red_flags?: string[] | null
  possible_conditions?: Array<{ name: string; confidence: number }> | null
  vitals?: {
    temperature?: string
    heartRate?: string
    bloodPressure?: string
    oxygenSaturation?: string
  } | null
  created_at?: string
}

// Force the correct table name - use lowercase to match Supabase
const TRIAGE_TABLE = 'triage_history'

// Debug logging with timestamp to force refresh
console.log('=== TriageHistoryService INIT ===', new Date().toISOString())
console.log('TriageHistoryService using table:', TRIAGE_TABLE)
console.log('Environment VITE_TRIAGE_TABLE:', (import.meta as any).env?.VITE_TRIAGE_TABLE)
console.log('Current URL:', window.location.href)

export class TriageHistoryService {
  static async create(entry: Partial<TriageHistory>): Promise<TriageHistory> {
    const generateShortId = (): string => Math.random().toString(36).slice(2, 9)
    
    // Check if username exists in users table to avoid foreign key constraint
    let validUsername = null
    if (entry.username) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username')
          .eq('username', entry.username)
          .single()
        
        if (!userError && userData) {
          validUsername = entry.username
        } else {
          console.warn('Username not found in users table, storing as anonymous:', entry.username)
        }
      } catch (userCheckError: any) {
        console.warn('Error checking user existence:', userCheckError?.message)
      }
    }
    
    const fullPayload: any = {
      id: generateShortId(),
      username: validUsername,
      name: entry.name ?? null,
      age: entry.age ?? null,
      gender: entry.gender ?? null,
      symptoms: entry.symptoms ?? null,
      description: entry.description ?? null,
      disease_category: entry.disease_category ?? null,
      summary: entry.summary ?? null,
      urgency: entry.urgency ?? null,
      recommended_action: entry.recommended_action ?? null,
      recommended_action_reason: entry.recommended_action_reason ?? null,
      instant_remedies: entry.instant_remedies ?? null,
      recommended_actions: entry.recommended_actions ?? null,
      red_flags: entry.red_flags ?? null,
      possible_conditions: entry.possible_conditions ?? null,
      vitals: entry.vitals ?? null,
    }

    const minimalPayload: any = {
      id: fullPayload.id,
      username: fullPayload.username,
      name: fullPayload.name,
      age: fullPayload.age,
      gender: fullPayload.gender,
      symptoms: fullPayload.symptoms,
      description: fullPayload.description,
      disease_category: fullPayload.disease_category,
      summary: fullPayload.summary,
      urgency: fullPayload.urgency,
      recommended_action: fullPayload.recommended_action,
      recommended_action_reason: fullPayload.recommended_action_reason,
    }

    let data: any | null = null
    try {
      let res = await supabase
        .from(TRIAGE_TABLE)
        .insert(fullPayload)
        .select('*')
        .single()
      if (res.error) {
        // Fallback to minimal set of columns if table lacks the full schema
        res = await supabase
          .from(TRIAGE_TABLE)
          .insert(minimalPayload)
          .select('*')
          .single()
        if (res.error) throw res.error
      }
      data = res.data
    } catch (e) {
      throw e
    }
    // Data is already in correct format since we're using jsonb columns
    const row: any = data
    return row as TriageHistory
  }

  static async update(id: string, entry: Partial<TriageHistory>): Promise<TriageHistory> {
    const fullPayload: any = {
      name: entry.name ?? null,
      age: entry.age ?? null,
      gender: entry.gender ?? null,
      symptoms: entry.symptoms ?? null,
      description: entry.description ?? null,
      disease_category: entry.disease_category ?? null,
      summary: entry.summary ?? null,
      urgency: entry.urgency ?? null,
      recommended_action: entry.recommended_action ?? null,
      recommended_action_reason: entry.recommended_action_reason ?? null,
      instant_remedies: Array.isArray(entry.instant_remedies)
        ? JSON.stringify(entry.instant_remedies)
        : entry.instant_remedies ?? null,
      recommended_actions: Array.isArray(entry.recommended_actions)
        ? JSON.stringify(entry.recommended_actions)
        : entry.recommended_actions ?? null,
      red_flags: Array.isArray(entry.red_flags)
        ? JSON.stringify(entry.red_flags)
        : entry.red_flags ?? null,
      possible_conditions: Array.isArray(entry.possible_conditions)
        ? JSON.stringify(entry.possible_conditions)
        : entry.possible_conditions ?? null,
      vitals: entry.vitals ? JSON.stringify(entry.vitals) : null,
    }

    const minimalPayload: any = {
      name: fullPayload.name,
      age: fullPayload.age,
      gender: fullPayload.gender,
      symptoms: fullPayload.symptoms,
      description: fullPayload.description,
      disease_category: fullPayload.disease_category,
      summary: fullPayload.summary,
      urgency: fullPayload.urgency,
      recommended_action: fullPayload.recommended_action,
      recommended_action_reason: fullPayload.recommended_action_reason,
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
    for (const key of ['instant_remedies', 'recommended_actions', 'red_flags', 'possible_conditions', 'vitals']) {
      const val = row[key]
      if (typeof val === 'string') {
        try { row[key] = JSON.parse(val) } catch { /* ignore */ }
      }
    }
    return row as TriageHistory
  }

  static async list(username?: string): Promise<TriageHistory[]> {
    console.log('TriageHistoryService.list() called with table:', TRIAGE_TABLE)
    console.log('Supabase client configured:', !!supabase)
    
    // Force clear any cached references
    const tableName = TRIAGE_TABLE
    console.log('Using hardcoded table name:', tableName)
    
    let query = supabase
      .from(tableName)
      .select('*')
    if (username) query = query.eq('username', username)
    // Order by created_at if the column exists; otherwise fetch without ordering
    let dataResp
    try {
      dataResp = await query.order('created_at', { ascending: false })
    } catch {
      dataResp = await query
    }
    const { data, error } = dataResp
    if (error) {
      console.error('TriageHistoryService.list() error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw error
    }
    console.log('TriageHistoryService.list() success, data count:', data?.length || 0)
    const rows = (data as any[]) || []
    return rows.map((row) => {
      const out = { ...row }
      for (const key of ['instant_remedies', 'recommended_actions', 'red_flags', 'possible_conditions', 'vitals']) {
        const val = out[key]
        if (typeof val === 'string') {
          try { out[key] = JSON.parse(val) } catch { /* ignore */ }
        }
      }
      return out as TriageHistory
    })
  }

  static async getById(id: string): Promise<TriageHistory | null> {
    console.log('TriageHistoryService.getById() called with id:', id)
    
    const tableName = TRIAGE_TABLE
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('TriageHistoryService.getById() error:', error)
      throw error
    }
    
    if (!data) {
      return null
    }
    
    const row: any = data
    for (const key of ['instant_remedies', 'recommended_actions', 'red_flags', 'possible_conditions', 'vitals']) {
      const val = row[key]
      if (typeof val === 'string') {
        try { row[key] = JSON.parse(val) } catch { /* ignore */ }
      }
    }
    
    return row as TriageHistory
  }
}
