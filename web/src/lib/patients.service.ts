import { supabase } from './supabaseClient'

export type Patient = {
  id: string
  first_name: string
  last_name: string
}

export class PatientsService {
  static async listPatients(): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .order('first_name', { ascending: true })
    if (error) throw error
    return (data as Patient[]) || []
  }

  static async createPatient(input: Omit<Patient, 'id'> & {
    date_of_birth?: string
    gender?: string
    phone?: string
    email?: string
    address?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    blood_type?: string
    allergies?: string
  }): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .insert(input)
      .select('id, first_name, last_name')
      .single()
    if (error) throw error
    return data as Patient
  }
}
