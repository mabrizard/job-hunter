import React, { useState } from 'react'
import { callClaude } from '../lib/api'
import { Card, Button, Alert, Tag, PageHeader, Select, Spinner, JobSwitcher } from './UI'

function buildCLSystem(profile, tone) {
  return `You are an expert cover letter writer for senior pre-sales leaders. Write in a ${tone} style.
CANDIDATE (RAG context):
Name: ${profile.name} | Strengths: ${profile.strengths} | CV summary: ${profile.cvSummary}
RULES: NO generic phrases. 3 paragraphs: hook, evidence (3 differentiators), close. Max 250 words. Match job language (FR/EN). Peer tone.`
}

function buildCVSystem(profile) {
  return `You are an expert CV advisor for senior pre-sales roles.
CANDIDATE (RAG context): Strengths: ${profile.strengths} | CV: ${profile.cvSummary}
Provide 6–8 specific actionable CV tips. Format: numbered list. WHAT → WHY. Reference actual requirements. No generic advice.`
}

export default function Adapter({ t, selectedJob, jobs, profile, onUpdateJob, onSelectJob, onNavigate }) {
  const [tab, setTab] = useState('cl')
  const [tone, setTone] = useState('executive, confident, direct')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const TONES = [
    { value: 'executive, confident, direct — short sentences, no fluff', label: t('adapterTone1') },
    { value: 'collaborative, human, warm — peer-to-peer tone', label: t('adapterTone2') },
    { value: 'technical, precise, results-focused — metrics and specifics', label: t('adapterTone3') },
  ]

  async function generate() {
    if (!selectedJob) return
    setLoading(true); setError('')
    try {
      if (tab === 'cl') {
        const text = await callClaude(buildCLSystem(profile, tone),
          `Write a cover letter for: ${selectedJob.title} at ${selectedJob.company} (${selectedJob.location})\nResponsibilities: ${selectedJob.keyResponsibilities}\nRequired: ${(selectedJob.requiredStack||[]).join(', ')}`, 1000)
        onUpdateJob(selectedJob.id, { coverLetter: text, coverLetterTone: tone, coverLetterDate: new Date().toISOString() })
      } else {
        const text = await callClaude(buildCVSystem(profile),
          `CV tips for: ${selectedJob.title} at ${selectedJob.company}\nRole type: ${selectedJob.roleType} | Seniority: ${selectedJob.seniority}\nRequirements: ${(selectedJob.requiredStack||[]).join(', ')}\nResponsibilities: ${selectedJob.keyResponsibilities}`, 1000)
        onUpdateJob(selectedJob.id, { cvTips: text, cvTipsDate: new Date().toISOString() })
      }
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function copy() {
    const text = tab === 'cl' ? selectedJob?.coverLetter : selectedJob?.cvTips
    if (!text) return
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const output = tab === 'cl' ? selectedJob?.coverLetter : selectedJob?.cvTips
  const outputDate = tab === 'cl' ? selectedJob?.coverLetterDate : selectedJob?.cvTipsDate

  return (
    <div>
      <PageHeader title={t('adapterTitle')} subtitle={t('adapterSubtitle')} />
      {!selectedJob ? (
        <Alert variant="warning">{t('noJobSelected')} <button onClick={() => onNavigate('scanner')} className="underline cursor-pointer">{t('scanFirst')}</button></Alert>
      ) : (
        <>
          <JobSwitcher jobs={jobs} selectedId={selectedJob.id} onSelect={onSelectJob} />
          <Card className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{selectedJob.title}</div>
                <div className="text-[12px] text-gray-500">{selectedJob.company} · {selectedJob.location}</div>
              </div>
              <Tag variant="purple">{selectedJob.roleType}</Tag>
            </div>
          </Card>

          <div className="flex border-b border-gray-100 mb-4">
            {[
              { id: 'cl', label: t('adapterTabCL'), saved: !!selectedJob.coverLetter },
              { id: 'cv', label: t('adapterTabCV'), saved: !!selectedJob.cvTips },
            ].map(tabItem => (
              <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
                className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                  tab === tabItem.id ? 'border-[#534AB7] text-[#534AB7] font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}>
                {tabItem.label}
                {tabItem.saved && <span className="text-[10px] bg-[#EEEDFE] text-[#534AB7] px-1.5 py-0.5 rounded">{t('adapterSaved')}</span>}
              </button>
            ))}
          </div>

          <Card className="mb-4">
            {tab === 'cl' && (
              <div className="mb-3">
                <Select label={t('adapterToneLabel')} value={tone} onChange={e => setTone(e.target.value)}>
                  {TONES.map(to => <option key={to.value} value={to.value}>{to.label}</option>)}
                </Select>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button variant="primary" onClick={generate} disabled={loading}>
                {loading
                  ? <><Spinner />{tab === 'cl' ? t('adapterWriting') : t('adapterAnalyzing')}</>
                  : <><i className={`ti ${tab === 'cl' ? 'ti-wand' : 'ti-list-check'}`} />
                    {output ? (tab === 'cl' ? t('adapterRegenCL') : t('adapterRegenCV')) : (tab === 'cl' ? t('adapterGenCL') : t('adapterGenCV'))}</>
                }
              </Button>
              {error && <span className="text-[12px] text-red-600">{error}</span>}
            </div>
          </Card>

          {output && (
            <Card>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-[12px] text-gray-500 font-medium">{tab === 'cl' ? t('adapterCLLabel') : t('adapterCVLabel')}</div>
                  {outputDate && <span className="text-[11px] text-gray-400">· {new Date(outputDate).toLocaleDateString()}</span>}
                </div>
                <Button size="sm" onClick={copy}>
                  <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />{copied ? t('copied') : t('copy')}
                </Button>
              </div>
              <div contentEditable suppressContentEditableWarning
                onBlur={e => { const text = e.target.innerText; tab === 'cl' ? onUpdateJob(selectedJob.id, { coverLetter: text }) : onUpdateJob(selectedJob.id, { cvTips: text }) }}
                className="text-[13px] leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 outline-none focus:bg-white focus:ring-1 focus:ring-[#534AB7]">
                {output}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">{t('adapterEditHint')}</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
