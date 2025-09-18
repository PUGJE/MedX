import { supabase } from './supabaseClient'

export type MedicalRecord = {
  id: string
  patient_id: string
  doctor_name: string
  visit_date: string
  diagnosis?: string
  symptoms?: string
  treatment?: string
  notes?: string
  created_at: string
}

export class RecordsService {
  static async listRecords(patientId?: string): Promise<MedicalRecord[]> {
    let query = supabase
      .from('medical_records')
      .select('*')
      .order('visit_date', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data as MedicalRecord[]) || []
  }

  static async getRecord(id: string): Promise<MedicalRecord | null> {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return (data as MedicalRecord) || null
  }

  static async createRecord(record: Omit<MedicalRecord, 'id' | 'created_at'>): Promise<MedicalRecord> {
    const { data, error } = await supabase
      .from('medical_records')
      .insert(record)
      .select('*')
      .single()
    if (error) throw error
    return data as MedicalRecord
  }

  static async updateRecord(id: string, updates: Partial<Omit<MedicalRecord, 'id' | 'created_at'>>): Promise<MedicalRecord> {
    const { data, error } = await supabase
      .from('medical_records')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as MedicalRecord
  }

  static async deleteRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
