import React, { useState, useEffect } from 'react'
import { loadState, saveToStorage } from './lib/state'
import Scanner from './components/Scanner'
import Qualify from './components/Qualify'
import Pipeline from './components/Pipeline'
import Adapter from './components/Adapter'
import Outreach from './components/Outreach'
import ProfilePage from './components/ProfilePage'
import ApiKeyPage from './components/ApiKeyPage'

const NAV = [
  { id: 'scanner',  label: 'Job Scanner',  icon: 'ti-search',          section: 'workflow' },
  { id: 'qualify',  label: 'Pre-Qualify',  icon: 'ti-bolt',            section: 'workflow' },
  { id: 'pipeline', label: 'Pipeline',     icon: 'ti-layout-kanban',   section: 'workflow' },
  { id: 'adapter',  label: 'Doc Adapter',  icon: 'ti-file-text',       section: 'workflow' },
  { id: 'outreach', label: 'Outreach',     icon: 'ti-message',         section: 'workflow' },
  { id: 'profile',  label: 'My Profile',   icon: 'ti-user',            section: 'settings' },
  { id: 'apikey',   label: 'API Key',      icon: 'ti-key',             section: 'settings' },
]

export default function App() {
  const [page, setPage] = useState('scanner')
  const [appState, setAppState] = useState(() => loadState())

  // Persist pipeline changes
  useEffect(() => {
    saveToStorage('ph_pipeline', appState.pipeline)
  }, [appState.pipeline])

  function navigate(p) { setPage(p) }

  function handleJobScanned(job, addToPipeline = false) {
    setAppState(s => ({ ...s, currentJob: job, currentScore: null }))
    saveToStorage('ph_currentjob', job)
    saveToStorage('ph_currentscore', null)
    if (addToPipeline) addJobToPipeline(job, null)
  }

  function handleScored(score) {
    setAppState(s => ({ ...s, currentScore: score }))
    saveToStorage('ph_currentscore', score)
  }

  function addJobToPipeline(job, score) {
    if (!job) return
    const id = job._url || `${job.title}-${job.company}-${Date.now()}`
    if (appState.pipeline.find(p => p.id === id)) return
    const entry = {
      id,
      title: job.title,
      company: job.company,
      location: job.location,
      roleType: job.roleType,
      score: score?.total ?? null,
      recommendation: score?.recommendation ?? null,
      status: 'identified',
      contacts: '',
      lastAction: new Date().toISOString().split('T')[0],
      nextFollowUp: '',
      notes: '',
      url: job._url || '',
    }
    setAppState(s => ({ ...s, pipeline: [...s.pipeline, entry] }))
    navigate('pipeline')
  }

  function handleProfileSave(profile) {
    setAppState(s => ({ ...s, profile }))
    saveToStorage('ph_profile', profile)
  }

  function handleApiKeySave(key) {
    setAppState(s => ({ ...s, apiKey: key }))
    localStorage.setItem('ph_apikey', key)
  }

  function handlePipelineUpdate(pipeline) {
    setAppState(s => ({ ...s, pipeline }))
  }

  const workflow = NAV.filter(n => n.section === 'workflow')
  const settings = NAV.filter(n => n.section === 'settings')
  const activeCount = appState.pipeline.filter(p => p.status !== 'closed').length

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col py-5">
        {/* Logo */}
        <div className="px-5 pb-4 border-b border-gray-100 mb-2">
          <div className="text-[15px] font-medium tracking-tight">🎯 Job Hunter</div>
          <div className="text-[11px] text-gray-400 mt-0.5">AI-native job search</div>
        </div>

        {/* Workflow nav */}
        <div className="px-4 pt-3 pb-1">
          <div className="text-[10px] font-medium uppercase tracking-widest text-gray-300 mb-1">Workflow</div>
        </div>
        {workflow.map(item => (
          <NavItem
            key={item.id}
            item={item}
            active={page === item.id}
            onClick={() => navigate(item.id)}
            badge={item.id === 'pipeline' && activeCount > 0 ? activeCount : null}
          />
        ))}

        {/* Settings nav */}
        <div className="px-4 pt-4 pb-1">
          <div className="text-[10px] font-medium uppercase tracking-widest text-gray-300 mb-1">Settings</div>
        </div>
        {settings.map(item => (
          <NavItem
            key={item.id}
            item={item}
            active={page === item.id}
            onClick={() => navigate(item.id)}
            badge={item.id === 'apikey' && !appState.apiKey && !import.meta.env.PROD ? '!' : null}
          />
        ))}

        {/* Current job indicator */}
        {appState.currentJob && (
          <div className="mt-auto mx-3 mb-2 p-2.5 bg-[#EEEDFE] rounded-lg">
            <div className="text-[10px] text-[#7F77DD] font-medium uppercase tracking-wide mb-0.5">Active job</div>
            <div className="text-[11px] text-[#3C3489] font-medium truncate">{appState.currentJob.title}</div>
            <div className="text-[10px] text-[#534AB7] truncate">{appState.currentJob.company}</div>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {page === 'scanner'  && <Scanner onJobScanned={handleJobScanned} currentJob={appState.currentJob} />}
          {page === 'qualify'  && <Qualify currentJob={appState.currentJob} currentScore={appState.currentScore} profile={appState.profile} onScored={handleScored} onNavigate={navigate} />}
          {page === 'pipeline' && <Pipeline pipeline={appState.pipeline} currentJob={appState.currentJob} currentScore={appState.currentScore} onUpdate={handlePipelineUpdate} onNavigate={navigate} />}
          {page === 'adapter'  && <Adapter currentJob={appState.currentJob} profile={appState.profile} onNavigate={navigate} />}
          {page === 'outreach' && <Outreach currentJob={appState.currentJob} profile={appState.profile} />}
          {page === 'profile'  && <ProfilePage profile={appState.profile} onSave={handleProfileSave} />}
          {page === 'apikey'   && <ApiKeyPage apiKey={appState.apiKey} onSave={handleApiKeySave} />}
        </div>
      </main>
    </div>
  )
}

function NavItem({ item, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-2 text-[13px] transition-all border-l-2 ${
        active
          ? 'border-[#534AB7] bg-[#EEEDFE] text-[#3C3489] font-medium'
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
