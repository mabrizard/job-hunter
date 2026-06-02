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
- 3 paragraphs only: (1) hook — why this role/company specifically, (2) evidence — 3 differentiators mapped to their stated needs, (3) close — availability, bilingual asset if relevant, clear CTA
- Max 250 words
- Write in the language of the job posting (detect French vs English automatically)
- Sound like a peer writing to a peer, not a candidate writing to a gatekeeper`
}

function buildCVSystem(profile) {
  return `You are an expert CV advisor for senior pre-sales roles in enterprise SaaS.

CANDIDATE (RAG context):
Strengths: ${profile.strengths}
CV summary: ${profile.cvSummary}

Analyze the job requirements vs the candidate profile and provide 6–8 specific, actionable CV adaptation tips.
Format: numbered list. Each tip: WHAT to change/add/emphasize → WHY it matters for this specific role.
Be concrete — reference actual job requirements. No generic advice.`
}

const TONES = [
  { value: 'executive, confident, direct — short sentences, no fluff', label: 'Executive — confident & direct' },
  { value: 'collaborative, human, warm — peer-to-peer tone', label: 'Collaborative — human & warm' },
  { value: 'technical, precise, results-focused — metrics and specifics', label: 'Technical — precise & results-focused' },
]

export default function Adapter({ currentJob, profile, onNavigate }) {
  const [tab, setTab] = useState('cl')
  const [tone, setTone] = useState(TONES[0].value)
  const [clOutput, setClOutput] = useState('')
  const [cvOutput, setCvOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (!currentJob) return
    setLoading(true)
    setError('')
    try {
      if (tab === 'cl') {
        const sys = buildCLSystem(profile, tone)
        const userMsg = `Write a cover letter for:
Role: ${currentJob.title} at ${currentJob.company} (${currentJob.location})
Responsibilities: ${currentJob.keyResponsibilities}
Required: ${(currentJob.requiredStack || []).join(', ')}
Compensation: ${currentJob.compensation || 'Not specified'}`
        const text = await callClaude(sys, userMsg, 1000)
        setClOutput(text)
      } else {
        const sys = buildCVSystem(profile)
        const userMsg = `Provide CV adaptation tips for:
Role: ${currentJob.title} at ${currentJob.company} (${currentJob.location})
Role type: ${currentJob.roleType} | Seniority: ${currentJob.seniority}
Requirements: ${(currentJob.requiredStack || []).join(', ')}
Responsibilities: ${currentJob.keyResponsibilities}`
        const text = await callClaude(sys, userMsg, 1000)
        setCvOutput(text)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const output = tab === 'cl' ? clOutput : cvOutput

  return (
    <div>
      <PageHeader title="Document Adapter" subtitle="Generate a tailored cover letter or CV adaptation tips for the loaded job" />

      {!currentJob ? (
        <Alert variant="warning">
          No job loaded.{' '}
          <button onClick={() => onNavigate('scanner')} className="underline cursor-pointer">Go to Job Scanner</button>
          {' '}first.
        </Alert>
      ) : (
        <>
          <Card className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{currentJob.title}</div>
                <div className="text-[12px] text-gray-500">{currentJob.company} · {currentJob.location}</div>
              </div>
              <Tag variant="purple">{currentJob.roleType}</Tag>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 mb-4">
            {[{ id: 'cl', label: 'Cover Letter' }, { id: 'cv', label: 'CV Tips' }].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition-colors ${
                  tab === t.id ? 'border-[#534AB7] text-[#534AB7] font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Card className="mb-4">
            {tab === 'cl' && (
              <div className="mb-3">
                <Select
                  label="Tone & style"
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                >
                  {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button variant="primary" onClick={generate} disabled={loading}>
                {loading
                  ? <><Spinner />{tab === 'cl' ? 'Writing…' : 'Analyzing…'}</>
                  : <><i className={`ti ${tab === 'cl' ? 'ti-wand' : 'ti-list-check'}`} />{tab === 'cl' ? (clOutput ? 'Regenerate' : 'Generate cover letter') : (cvOutput ? 'Re-analyze' : 'Generate CV tips')}</>
                }
              </Button>
              {error && <span className="text-[12px] text-red-600">{error}</span>}
            </div>
          </Card>

          {output && (
            <Card>
              <div className="flex justify-between items-center mb-3">
                <div className="text-[12px] text-gray-500 font-medium">
                  {tab === 'cl' ? 'Generated cover letter' : 'CV adaptation tips'}
                </div>
                <Button size="sm" onClick={() => copy(output)}>
                  <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                className="text-[13px] leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 outline-none focus:bg-white focus:ring-1 focus:ring-[#534AB7] transition-all"
              >
                {output}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
