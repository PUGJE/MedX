import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RecordsService, type MedicalRecord } from '../lib/records.service'
import { PatientsService, type Patient } from '../lib/patients.service'
import { TriageHistoryService, type TriageHistory } from '../lib/triageHistory.service'
import { useAuth } from '../state/AuthContext'

export default function RecordsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [triage, setTriage] = useState<TriageHistory[]>([])

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false)
  const [patientSubmitting, setPatientSubmitting] = useState<boolean>(false)
  const [patientError, setPatientError] = useState<string | null>(null)
  const [patientForm, setPatientForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
  })
  const [form, setForm] = useState({
    patient_id: '',
    doctor_name: '',
    visit_date: new Date().toISOString().slice(0, 10),
    diagnosis: '',
    symptoms: '',
    treatment: '',
    notes: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        setLoading(true)
        const data = await RecordsService.listRecords()
        if (isMounted) setRecords(data)
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : 'Failed to load records')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    let isMounted = true
    PatientsService.listPatients().then((p) => {
      if (isMounted) setPatients(p)
    }).catch(() => {})
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    let isMounted = true
    TriageHistoryService.list(user?.username).then((items) => {
      if (isMounted) setTriage(items)
    }).catch(() => {})
    return () => { isMounted = false }
  }, [user?.username])

  async function reload() {
    try {
      setLoading(true)
      const data = await RecordsService.listRecords()
      setRecords(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!form.patient_id || !form.doctor_name) {
      setFormError('Patient ID and Doctor name are required')
      return
    }
    try {
      setSubmitting(true)
      if (editingId) {
        await RecordsService.updateRecord(editingId, {
          patient_id: form.patient_id,
          doctor_name: form.doctor_name,
          visit_date: form.visit_date,
          diagnosis: form.diagnosis || undefined,
          symptoms: form.symptoms || undefined,
          treatment: form.treatment || undefined,
          notes: form.notes || undefined,
        })
      } else {
        await RecordsService.createRecord({
          patient_id: form.patient_id,
          doctor_name: form.doctor_name,
          visit_date: form.visit_date,
          diagnosis: form.diagnosis || undefined,
          symptoms: form.symptoms || undefined,
          treatment: form.treatment || undefined,
          notes: form.notes || undefined,
        })
      }
      setIsModalOpen(false)
      setEditingId(null)
      setForm({
        patient_id: '',
        doctor_name: '',
        visit_date: new Date().toISOString().slice(0, 10),
        diagnosis: '',
        symptoms: '',
        treatment: '',
        notes: '',
      })
      await reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save record')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-40 bg-gray-800/40 rounded animate-pulse" />
        <div className="h-24 w-full bg-gray-800/40 rounded animate-pulse" />
        <div className="h-24 w-full bg-gray-800/40 rounded animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Medical Records</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-500 text-sm"
        >
          Add record
        </button>
        <button
          onClick={() => setIsPatientModalOpen(true)}
          className="ml-2 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10 text-sm"
        >
          Add patient
        </button>
      </div>

      {!records.length ? (
        <div className="text-center text-sm text-gray-300">No records yet.</div>
      ) : (
        <ul className="space-y-3">
          {records.map((r) => (
            <li key={r.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.doctor_name} — {new Date(r.visit_date).toLocaleDateString()}</div>
                  {r.diagnosis ? (
                    <div className="text-sm text-gray-300">Diagnosis: {r.diagnosis}</div>
                  ) : null}
                  {r.symptoms ? (
                    <div className="text-xs text-gray-400 line-clamp-2">Symptoms: {r.symptoms}</div>
                  ) : null}
                  {r.treatment ? (
                    <div className="text-xs text-gray-400 line-clamp-2">Treatment: {r.treatment}</div>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10"
                    onClick={() => {
                      setEditingId(r.id)
                      setForm({
                        patient_id: r.patient_id,
                        doctor_name: r.doctor_name,
                        visit_date: r.visit_date?.slice(0, 10),
                        diagnosis: r.diagnosis || '',
                        symptoms: r.symptoms || '',
                        treatment: r.treatment || '',
                        notes: r.notes || '',
                      })
                      setIsModalOpen(true)
                    }}
                  >Edit</button>
                  <button
                    className="text-xs px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10"
                    onClick={async () => {
                      if (!confirm('Delete this record?')) return
                      await RecordsService.deleteRecord(r.id)
                      await reload()
                    }}
                  >Delete</button>
                  <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-6">
        <h2 className="text-xl font-semibold mb-2">Triage Bot History</h2>
        {!triage.length ? (
          <div className="text-sm text-gray-300">No triage history.</div>
        ) : (
          <ul className="space-y-3">
            {triage.map((t) => (
              <li key={t.id} className="rounded-lg border border-white/10 bg-white/5 p-4 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate(`/records/triage/${t.id}`)}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{t.disease_category || 'Assessment'}</div>
                    {t.name && (
                      <div className="text-sm text-teal-300 font-medium">{t.name}</div>
                    )}
                    {t.summary ? (
                      <div className="text-sm text-gray-300 line-clamp-2">{t.summary}</div>
                    ) : null}
                    {t.recommended_actions && t.recommended_actions.length ? (
                      <div className="text-xs text-gray-400 mt-1">Recommended: {t.recommended_actions.join('; ')}</div>
                    ) : null}
                    <div className="text-xs text-gray-500 mt-1">
                      {t.gender ? `${t.gender}, ` : ''}{t.age ? `${t.age}y` : ''}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{t.created_at ? new Date(t.created_at).toLocaleString() : ''}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => !submitting && setIsModalOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 md:inset-0 md:m-auto md:h-fit md:max-w-lg md:rounded-xl md:border md:border-white/10 bg-gray-900 p-4">
            <h2 className="text-lg font-semibold mb-3">{editingId ? 'Edit' : 'Add'} medical record</h2>
            {formError ? (
              <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 p-2 text-xs">{formError}</div>
            ) : null}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <label className="text-sm">Patient
                  <select
                    value={form.patient_id}
                    onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm"
                    required
                  >
                    <option value="" disabled>Select patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">Doctor name
                  <input
                    value={form.doctor_name}
                    onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm"
                    required
                  />
                </label>
                <label className="text-sm">Visit date
                  <input
                    type="date"
                    value={form.visit_date}
                    onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm">Diagnosis
                  <input
                    value={form.diagnosis}
                    onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm">Symptoms
                  <textarea
                    value={form.symptoms}
                    onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm"
                    rows={3}
                  />
                </label>
                <label className="text-sm">Treatment
                  <textarea
                    value={form.treatment}
                    onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm"
                    rows={3}
                  />
                </label>
                <label className="text-sm">Notes
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm"
                    rows={3}
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" disabled={submitting} onClick={() => setIsModalOpen(false)} className="px-3 py-2 rounded border border-white/10 text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-500 text-white text-sm">
                  {submitting ? 'Saving…' : 'Save record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPatientModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => !patientSubmitting && setIsPatientModalOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 md:inset-0 md:m-auto md:h-fit md:max-w-lg md:rounded-xl md:border md:border-white/10 bg-gray-900 p-4">
            <h2 className="text-lg font-semibold mb-3">Add patient</h2>
            {patientError ? (
              <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 p-2 text-xs">{patientError}</div>
            ) : null}
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setPatientError(null)
                if (!patientForm.first_name || !patientForm.last_name || !patientForm.gender || !patientForm.date_of_birth) {
                  setPatientError('First name, Last name, Gender and DOB are required')
                  return
                }
                try {
                  setPatientSubmitting(true)
                  const created = await PatientsService.createPatient({
                    first_name: patientForm.first_name,
                    last_name: patientForm.last_name,
                    gender: patientForm.gender,
                    date_of_birth: patientForm.date_of_birth,
                  })
                  const refreshed = await PatientsService.listPatients()
                  setPatients(refreshed)
                  setForm((f) => ({ ...f, patient_id: created.id }))
                  setIsPatientModalOpen(false)
                  setPatientForm({ first_name: '', last_name: '', date_of_birth: '', gender: '' })
                } catch (err) {
                  setPatientError(err instanceof Error ? err.message : 'Failed to create patient')
                } finally {
                  setPatientSubmitting(false)
                }
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 gap-3">
                <label className="text-sm">First name
                  <input
                    value={patientForm.first_name}
                    onChange={(e) => setPatientForm({ ...patientForm, first_name: e.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm"
                    required
                  />
                </label>
                <label className="text-sm">Last name
                  <input
                    value={patientForm.last_name}
                    onChange={(e) => setPatientForm({ ...patientForm, last_name: e.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm"
                    required
                  />
                </label>
                <label className="text-sm">Date of birth
                  <input
                    type="date"
                    value={patientForm.date_of_birth}
                    onChange={(e) => setPatientForm({ ...patientForm, date_of_birth: e.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm"
                    required
                  />
                </label>
                <label className="text-sm">Gender
                  <select
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm"
                    required
                  >
                    <option value="" disabled>Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" disabled={patientSubmitting} onClick={() => setIsPatientModalOpen(false)} className="px-3 py-2 rounded border border-white/10 text-sm">Cancel</button>
                <button type="submit" disabled={patientSubmitting} className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-500 text-white text-sm">
                  {patientSubmitting ? 'Saving…' : 'Save patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


