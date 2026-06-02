import React, { useState, useEffect, useCallback } from 'react'
import { DEFAULT_PROFILE, createJob, PIPELINE_COLUMNS } from './lib/state'
import { useLanguage } from './lib/useLanguage'
import { isSupabaseEnabled } from './lib/supabase'
import { onAuthChange, getSession, signOut } from './lib/sync'
import { loadJobs, saveJob, deleteJob, saveAllJobs, loadProfile, saveProfile, migrateLocalStorageToSupabase } from './lib/sync'
import Scanner from './components/Scanner'
import Qualify from './components/Qualify'
import Pipeline from './components/Pipeline'
import Adapter from './components/Adapter'
import Outreach from './components/Outreach'
import ProfilePage from './components/ProfilePage'
import ApiKeyPage from './components/ApiKeyPage'
import Timeline from './components/Timeline'
import ATSScore from './components/ATSScore'
import CVUpload from './components/CVUpload'
import RefDocs from './components/RefDocs'
import AuthModal from './components/AuthModal'

export default function App() {
  const [page, setPage] = useState('scanner')
  const { lang, setLang, t } = useLanguage()

  // Auth
  const [session, setSession] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Core state
  const [jobs, setJobs] = useState([])
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [selectedJobId, setSelectedJobId] = useState(() => localStorage.getItem('ph_selectedjob') || null)
  const [cvText, setCvText] = useState(() => localStorage.getItem('ph_cvtext') || null)
  const [refCV, setRefCV] = useState(() => localStorage.getItem('ph_refcv') || null)
  const [refCoverLetter, setRefCoverLetter] = useState(() => localStorage.getItem('ph_refcl') || null)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ph_apikey') || '')
  const [loaded, setLoaded] = useState(false)

  const userId = session?.user?.id || null

  // Load data on mount / auth change
  useEffect(() => {
    async function load(uid) {
      setSyncing(true)
      try {
        const [loadedJobs, loadedProfile] = await Promise.all([
          loadJobs(uid),
          loadProfile(uid, DEFAULT_PROFILE),
        ])
        setJobs(loadedJobs)
        setProfile(loadedProfile)
        // Migrate localStorage on first Supabase login
        if (uid && localStorage.getItem('ph_migrated') !== 'true') {
          await migrateLocalStorageToSupabase(uid)
        }
      } catch(e) {
        console.error('Load error:', e)
      } finally {
        setSyncing(false)
        setLoaded(true)
      }
    }

    // Initial session check
    getSession().then(s => {
      setSession(s)
      load(s?.user?.id || null)
    })

    // Listen for auth changes
    const unsub = onAuthChange(s => {
      setSession(s)
      if (s) load(s.user.id)
    })
    return unsub
  }, [])

  const selectedJob = jobs.find(j => j.id === selectedJobId) || null

  // ── Job operations ──────────────────────────────────────────────────────────

  async function updateJob(id, patch) {
    const updated = jobs.map(j =>
      j.id === id ? { ...j, ...patch, lastAction: new Date().toISOString().split('T')[0] } : j
    )
    setJobs(updated)
    const updatedJob = updated.find(j => j.id === id)
    await saveJob(updatedJob, userId)
  }

  async function handleJobScanned(scanData) {
    const existing = jobs.find(j => j.title === scanData.title && j.company === scanData.company)
    if (existing) {
      setSelectedJobId(existing.id)
      localStorage.setItem('ph_selectedjob', existing.id)
    } else {
      const newJob = createJob(scanData)
      const newJobs = [newJob, ...jobs]
      setJobs(newJobs)
      setSelectedJobId(newJob.id)
      localStorage.setItem('ph_selectedjob', newJob.id)
      await saveJob(newJob, userId)
    }
    navigate('qualify')
  }

  function handleSelectJob(id) {
    setSelectedJobId(id)
    localStorage.setItem('ph_selectedjob', id)
  }

  async function handleDeleteJob(id) {
    const newJobs = jobs.filter(j => j.id !== id)
    setJobs(newJobs)
    const newSelected = selectedJobId === id ? (newJobs[0]?.id || null) : selectedJobId
    setSelectedJobId(newSelected)
    localStorage.setItem('ph_selectedjob', newSelected || '')
    await deleteJob(id, userId)
  }

  // ── Profile ─────────────────────────────────────────────────────────────────

  async function handleProfileSave(p) {
    setProfile(p)
    await saveProfile(p, userId)
  }

  // ── API key / CV / Ref docs (localStorage only) ──────────────────────────────

  function handleApiKeySave(key) {
    setApiKey(key)
    localStorage.setItem('ph_apikey', key)
  }

  function handleCVUpdate(text) {
    setCvText(text)
    if (text) localStorage.setItem('ph_cvtext', text)
    else localStorage.removeItem('ph_cvtext')
  }

  function handleRefCVUpdate(text) {
    setRefCV(text)
    if (text) localStorage.setItem('ph_refcv', text)
    else localStorage.removeItem('ph_refcv')
  }

  function handleRefCLUpdate(text) {
    setRefCoverLetter(text)
    if (text) localStorage.setItem('ph_refcl', text)
    else localStorage.removeItem('ph_refcl')
  }

  function navigate(p) { setPage(p) }

  // ── Nav ─────────────────────────────────────────────────────────────────────

  const activeCount = jobs.filter(j => !['closed', 'abandoned'].includes(j.status)).length

  const NAV = [
    { id: 'scanner',  label: t('navScanner'),  icon: 'ti-search',        section: 'workflow' },
    { id: 'qualify',  label: t('navQualify'),  icon: 'ti-bolt',          section: 'workflow' },
    { id: 'pipeline', label: t('navPipeline'), icon: 'ti-layout-kanban', section: 'workflow' },
    { id: 'adapter',  label: t('navAdapter'),  icon: 'ti-file-text',     section: 'workflow' },
    { id: 'outreach', label: t('navOutreach'), icon: 'ti-message',       section: 'workflow' },
    { id: 'ats',      label: t('navATS'),      icon: 'ti-target',        section: 'workflow' },
    { id: 'timeline', label: t('navTimeline'), icon: 'ti-chart-bar',     section: 'workflow' },
    { id: 'cv',       label: t('navCV'),       icon: 'ti-id',            section: 'settings' },
    { id: 'refdocs',  label: t('navRefDocs'),  icon: 'ti-files',         section: 'settings' },
    { id: 'profile',  label: t('navProfile'),  icon: 'ti-user',          section: 'settings' },
    { id: 'apikey',   label: t('navApiKey'),   icon: 'ti-key',           section: 'settings' },
  ]

  const sharedProps = {
    t, lang, selectedJob, jobs, profile, cvText, refCV, refCoverLetter,
    onUpdateJob: updateJob, onSelectJob: handleSelectJob, onNavigate: navigate
  }

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-3" style={{ width: 24, height: 24, borderWidth: 3 }} />
          <div className="text-[13px] text-gray-400">{lang === 'fr' ? 'Chargement…' : 'Loading…'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {showAuthModal && <AuthModal lang={lang} onClose={() => setShowAuthModal(false)} />}

      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col py-5">
        {/* Logo + lang toggle */}
        <div className="px-4 pb-4 border-b border-gray-100 mb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[15px] font-medium tracking-tight">🎯 Job Hunter</div>
            <div className="flex rounded-md border border-gray-200 overflow-hidden text-[11px]">
              {['fr', 'en'].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-2 py-1 transition-colors ${lang === l ? 'bg-[#534AB7] text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-gray-400">{t('appSubtitle')}</div>

          {/* Sync status */}
          {isSupabaseEnabled() && (
            <div className="mt-2">
              {session ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-green-700 truncate max-w-[100px]">{session.user.email}</span>
                  </div>
                  <button onClick={signOut} className="text-[10px] text-gray-400 hover:text-gray-600">
                    {lang === 'fr' ? 'Déco.' : 'Sign out'}
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)}
                  className="w-full flex items-center gap-1.5 text-[11px] text-[#534AB7] hover:text-[#3C3489] font-medium">
                  <i className="ti ti-cloud-upload text-sm" />
                  {lang === 'fr' ? 'Sync multi-appareils' : 'Enable sync'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Workflow nav */}
        <div className="px-4 pt-2 pb-1">
          <div className="text-[10px] font-medium uppercase tracking-widest text-gray-300 mb-1">{t('sectionWorkflow')}</div>
        </div>
        {NAV.filter(n => n.section === 'workflow').map(item => (
          <NavItem key={item.id} item={item} active={page === item.id} onClick={() => navigate(item.id)}
            badge={item.id === 'pipeline' && activeCount > 0 ? activeCount : null} />
        ))}

        {/* Settings nav */}
        <div className="px-4 pt-4 pb-1">
          <div className="text-[10px] font-medium uppercase tracking-widest text-gray-300 mb-1">{t('sectionSettings')}</div>
        </div>
        {NAV.filter(n => n.section === 'settings').map(item => (
          <NavItem key={item.id} item={item} active={page === item.id} onClick={() => navigate(item.id)}
            badge={item.id === 'apikey' && !apiKey && !import.meta.env.PROD ? '!' : null} />
        ))}

        {/* Active job chip */}
        {selectedJob && (
          <div className="mt-auto mx-3 mb-2 p-2.5 bg-[#EEEDFE] rounded-lg cursor-pointer" onClick={() => navigate('qualify')}>
            <div className="text-[10px] text-[#7F77DD] font-medium uppercase tracking-wide mb-0.5">{t('activeJob')}</div>
            <div className="text-[11px] text-[#3C3489] font-medium truncate">{selectedJob.title}</div>
            <div className="text-[10px] text-[#534AB7] truncate">{selectedJob.company}</div>
            {selectedJob.recommendation && (
              <div className={`mt-1 text-[10px] font-medium ${
                selectedJob.recommendation === 'GO' ? 'text-green-700' :
                selectedJob.recommendation === 'NO-GO' ? 'text-red-600' : 'text-amber-700'
              }`}>{selectedJob.recommendation} · {selectedJob.score}/100</div>
            )}
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {syncing && (
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-4">
              <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
              {lang === 'fr' ? 'Synchronisation…' : 'Syncing…'}
            </div>
          )}
          {page === 'scanner'  && <Scanner {...sharedProps} onJobScanned={handleJobScanned} />}
          {page === 'qualify'  && <Qualify {...sharedProps} />}
          {page === 'pipeline' && <Pipeline {...sharedProps} selectedJobId={selectedJobId} onDeleteJob={handleDeleteJob} />}
          {page === 'adapter'  && <Adapter {...sharedProps} />}
          {page === 'outreach' && <Outreach {...sharedProps} />}
          {page === 'ats'      && <ATSScore {...sharedProps} />}
          {page === 'timeline' && <Timeline t={t} lang={lang} jobs={jobs} />}
          {page === 'cv'       && <CVUpload t={t} lang={lang} cvText={cvText} onCVUpdate={handleCVUpdate} />}
          {page === 'refdocs'  && <RefDocs lang={lang} refCV={refCV} refCoverLetter={refCoverLetter} onRefCVUpdate={handleRefCVUpdate} onRefCLUpdate={handleRefCLUpdate} />}
          {page === 'profile'  && <ProfilePage t={t} profile={profile} onSave={handleProfileSave} />}
          {page === 'apikey'   && <ApiKeyPage t={t} apiKey={apiKey} onSave={handleApiKeySave} />}
        </div>
      </main>
    </div>
  )
}

function NavItem({ item, active, onClick, badge }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-2 text-[13px] transition-all border-l-2 ${
        active ? 'border-[#534AB7] bg-[#EEEDFE] text-[#3C3489] font-medium'
               : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'
      }`}
    >
      <span className="flex items-center gap-2.5">
        <i className={`ti ${item.icon} text-base`} />
        {item.label}
      </span>
      {badge && (
        <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${
          badge === '!' ? 'bg-amber-100 text-amber-700' : 'bg-[#534AB7] text-white'
        }`}>{badge}</span>
      )}
    </button>
  )
}
