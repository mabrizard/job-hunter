/**
 * Sync layer — abstracts localStorage vs Supabase
 * - If Supabase is configured and user is logged in: reads/writes to Supabase
 * - Falls back to localStorage transparently
 * - On first login: migrates existing localStorage data to Supabase
 */
import { supabase } from './supabase'

// ─── AUTH ────────────────────────────────────────────────────────────────────

export function isSupabaseEnabled() {
  return !!supabase
}

export async function signInWithEmail(email) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  })
  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthChange(callback) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data.subscription.unsubscribe()
}

// ─── JOBS ─────────────────────────────────────────────────────────────────────

export async function loadJobs(userId) {
  if (!supabase || !userId) {
    return JSON.parse(localStorage.getItem('ph_jobs') || '[]')
  }
  const { data, error } = await supabase
    .from('jobs')
    .select('data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(row => row.data)
}

export async function saveJob(job, userId) {
  // Always save to localStorage as cache
  const jobs = JSON.parse(localStorage.getItem('ph_jobs') || '[]')
  const idx = jobs.findIndex(j => j.id === job.id)
  if (idx >= 0) jobs[idx] = job
  else jobs.unshift(job)
  localStorage.setItem('ph_jobs', JSON.stringify(jobs))

  // Sync to Supabase if available
  if (!supabase || !userId) return
  const { error } = await supabase
    .from('jobs')
    .upsert({ id: job.id, user_id: userId, data: job, updated_at: new Date().toISOString() })
  if (error) console.error('Supabase sync error:', error)
}

export async function deleteJob(jobId, userId) {
  // Remove from localStorage
  const jobs = JSON.parse(localStorage.getItem('ph_jobs') || '[]')
  localStorage.setItem('ph_jobs', JSON.stringify(jobs.filter(j => j.id !== jobId)))

  // Delete from Supabase
  if (!supabase || !userId) return
  await supabase.from('jobs').delete().eq('id', jobId).eq('user_id', userId)
}

export async function saveAllJobs(jobs, userId) {
  localStorage.setItem('ph_jobs', JSON.stringify(jobs))
  if (!supabase || !userId || jobs.length === 0) return
  const rows = jobs.map(j => ({ id: j.id, user_id: userId, data: j, updated_at: new Date().toISOString() }))
  const { error } = await supabase.from('jobs').upsert(rows)
  if (error) console.error('Supabase bulk sync error:', error)
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export async function loadProfile(userId, defaultProfile) {
  if (!supabase || !userId) {
    return JSON.parse(localStorage.getItem('ph_profile') || 'null') || defaultProfile
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return JSON.parse(localStorage.getItem('ph_profile') || 'null') || defaultProfile
  return data.data
}

export async function saveProfile(profile, userId) {
  localStorage.setItem('ph_profile', JSON.stringify(profile))
  if (!supabase || !userId) return
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, data: profile, updated_at: new Date().toISOString() })
  if (error) console.error('Supabase profile sync error:', error)
}

// ─── MIGRATION ────────────────────────────────────────────────────────────────
// Run once on first login — pushes existing localStorage data to Supabase

export async function migrateLocalStorageToSupabase(userId) {
  if (!supabase || !userId) return

  const localJobs = JSON.parse(localStorage.getItem('ph_jobs') || '[]')
  const localProfile = JSON.parse(localStorage.getItem('ph_profile') || 'null')

  if (localJobs.length > 0) {
    await saveAllJobs(localJobs, userId)
    console.log(`Migrated ${localJobs.length} jobs to Supabase`)
  }

  if (localProfile) {
    await saveProfile(localProfile, userId)
    console.log('Migrated profile to Supabase')
  }

  localStorage.setItem('ph_migrated', 'true')
}

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────

export async function loadDocuments(userId) {
  if (!supabase || !userId) {
    return JSON.parse(localStorage.getItem('ph_documents') || '[]')
  }
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveDocument(doc, userId) {
  const docs = JSON.parse(localStorage.getItem('ph_documents') || '[]')
  const idx = docs.findIndex(d => d.id === doc.id)
  if (idx >= 0) docs[idx] = doc
  else docs.unshift(doc)
  localStorage.setItem('ph_documents', JSON.stringify(docs))

  if (!supabase || !userId) return doc
  const { data, error } = await supabase
    .from('documents')
    .upsert({ ...doc, user_id: userId, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDocument(docId, userId) {
  const docs = JSON.parse(localStorage.getItem('ph_documents') || '[]')
  localStorage.setItem('ph_documents', JSON.stringify(docs.filter(d => d.id !== docId)))
  if (!supabase || !userId) return
  await supabase.from('documents').delete().eq('id', docId).eq('user_id', userId)
}
