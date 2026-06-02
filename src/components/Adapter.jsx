import React, { useState } from 'react'
import { callClaude } from '../lib/api'
import { Card, Button, Alert, Tag, PageHeader, Select, Spinner } from './UI'

function buildCLSystem(profile, tone) {
  return `You are an expert cover letter writer for senior pre-sales leaders. Write in a ${tone} style.

CANDIDATE (RAG context):
Name: ${profile.name}
Strengths: ${profile.strengths}
CV summary: ${profile.cvSummary}

RULES:
- NO generic phrases ("I am excited to apply", "I believe I would be a great fit")
- 3 paragraphs: (1) hook — why this role/company specifically, (2) evidence — 3 differentiators mapped to their stated needs, (3) close — availability, bilingual asset if relevant, clear CTA
- Max 250 words
- Write in the language of the job posting (detect French vs English automatically)
- Sound like a peer writing to a peer, not a candidate to a gatekeeper`
}

function buildCVSystem(profile) {
  return `You are an expert CV advisor for senior pre-sales roles in enterprise SaaS.

CANDIDATE (RAG context):
Strengths: ${profile.strengths}
CV summary: ${profile.cvSummary}

Provide 6–8 specific, actionable CV adaptation tips.
Format: numbered list. Each tip: WHAT to change/add/emphasize → WHY it matters for this specific role.
Be concrete — reference actual job requirements. No generic advice.`
}

const TONES = [
  { value: 'executive, confident, direct — short sentences, no fluff', label: 'Executive — confident & direct' },
  { value: 'collaborative, human, warm — peer-to-peer tone', label: 'Collaborative — human & warm' },
  { value: 'technical, precise, results-focused — metrics and specifics', label: 'Technical — precise & results-focused' },
]

export default function Adapter({ selectedJob, jobs, profile, onUpdateJob, onSelectJob, onNavigate }) {
  const [tab, setTab] = useState('cl')
  const [tone, setTone] = useState(TONES[0].value)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (!selectedJob) return
    setLoading(true)
    setError('')
    try {
      if (tab === 'cl') {
        const sys = buildCLSystem(profile, tone)
        const userMsg = `Write a cover letter for:
Role: ${selectedJob.title} at ${selectedJob.company} (${selectedJob.location})
Responsibilities: ${selectedJob.keyResponsibilities}
Required: ${(selectedJob.requiredStack || []).join(', ')}
Compensation: ${selectedJob.compensation || 'Not specified'}`
        const text = await callClaude(sys, userMsg, 1000)
        onUpdateJob(selectedJob.id, { coverLetter: text, coverLetterTone: tone, coverLetterDate: new Date().toISOString() })
      } else {
        const sys = buildCVSystem(profile)
        const userMsg = `Provide CV adaptation tips for:
Role: ${selectedJob.title} at ${selectedJob.company} (${selectedJob.location})
Role type: ${selectedJob.roleType} | Seniority: ${selectedJob.seniority}
Requirements: ${(selectedJob.requiredStack || []).join(', ')}
Responsibilities: ${selectedJob.keyResponsibilities}`
        const text = await callClaude(sys, userMsg, 1000)
        onUpdateJob(selectedJob.id, { cvTips: text, cvTipsDate: new Date().toISOString() })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
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
      <PageHeader title="Document Adapter" subtitle="Cover letters and CV tips — saved per job posting" />

      {!selectedJob ? (
        <Alert variant="warning">No job selected. <button onClick={() => onNavigate('scanner')} className="underline cursor-pointer">Scan a job first.</button></Alert>
      ) : (
        <>
          <Card className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{selectedJob.title}</div>
                <div className="text-[12px] text-gray-500">{selectedJob.company} · {selectedJob.location}</div>
              </div>
              <div className="flex items-center gap-2">
                <Tag variant="purple">{selectedJob.roleType}</Tag>
                {jobs.length > 1 && (
                  <Select value={selectedJob.id} onChange={e => onSelectJob(e.target.value)}>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.company}</option>)}
                  </Select>
                )}
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 mb-4">
            {[
              { id: 'cl', label: 'Cover Letter', saved: !!selectedJob.coverLetter },
              { id: 'cv', label: 'CV Tips', saved: !!selectedJob.cvTips },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                  tab === t.id ? 'border-[#534AB7] text-[#534AB7] font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
                {t.saved && <span className="text-[10px] bg-[#EEEDFE] text-[#534AB7] px-1.5 py-0.5 rounded">✓ saved</span>}
              </button>
            ))}
          </div>

          <Card className="mb-4">
            {tab === 'cl' && (
              <div className="mb-3">
                <Select label="Tone & style" value={tone} onChange={e => setTone(e.target.value)}>
                  {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button variant="primary" onClick={generate} disabled={loading}>
                {loading
                  ? <><Spinner />{tab === 'cl' ? 'Writing…' : 'Analyzing…'}</>
                  : <><i className={`ti ${tab === 'cl' ? 'ti-wand' : 'ti-list-check'}`} />
                    {output ? 'Regenerate' : tab === 'cl' ? 'Generate cover letter' : 'Generate CV tips'}</>
                }
              </Button>
              {error && <span className="text-[12px] text-red-600">{error}</span>}
            </div>
          </Card>

          {output && (
            <Card>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-[12px] text-gray-500 font-medium">
                    {tab === 'cl' ? 'Cover letter' : 'CV tips'}
                  </div>
                  {outputDate && (
                    <span className="text-[11px] text-gray-400">
                      · {new Date(outputDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <Button size="sm" onClick={copy}>
                  <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={e => {
                  const text = e.target.innerText
                  if (tab === 'cl') onUpdateJob(selectedJob.id, { coverLetter: text })
                  else onUpdateJob(selectedJob.id, { cvTips: text })
                }}
                className="text-[13px] leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 outline-none focus:bg-white focus:ring-1 focus:ring-[#534AB7] transition-all"
              >
                {output}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Edits are saved automatically when you click away.</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
