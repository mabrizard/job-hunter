import React, { useState } from 'react'
import { callClaude, parseJSON } from '../lib/api'
import { saveToStorage } from '../lib/state'
import { Card, Button, Input, Textarea, Alert, Tag, PageHeader, Spinner } from './UI'

const SCAN_SYSTEM = `You are a job posting parser. You MUST return ONLY a valid JSON object. No apologies, no explanations, no markdown, no preamble. If content is missing, use null. Never refuse — always parse what you have.

Return exactly this JSON structure:
{
  "title": string,
  "company": string,
  "location": string,
  "roleType": "Pre-Sales" | "Solutions Consulting" | "Forward Deployed" | "Sales" | "Engineering" | "Product" | "Other",
  "seniority": "IC" | "Manager" | "Director" | "VP" | "C-Level" | "Unknown",
  "compensation": string or null,
  "requiredStack": string array (max 12 items — tools, methodologies, languages),
  "keyResponsibilities": string (2-3 sentence summary),
  "postedDate": string or null,
  "sourceUrl": string or null
}`

export default function Scanner({ onJobScanned, currentJob }) {
  const [tab, setTab] = useState('text')
  const [url, setUrl] = useState(currentJob?._url || '')
  const [text, setText] = useState(currentJob?._rawText || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runScan() {
    const input = tab === 'url' ? url.trim() : text.trim()
    if (!input) { setError('Enter a URL or paste job text first.'); return }
    setLoading(true)
    setError('')
    try {
      const userMsg = tab === 'url'
        ? `Parse this job posting URL: ${input}`
        : `Parse this job posting text and return JSON:\n\n${input}`
      const raw = await callClaude(SCAN_SYSTEM, userMsg, 1000)
      const job = parseJSON(raw)
      job._url = tab === 'url' ? input : ''
      job._rawText = tab === 'text' ? input : ''
      saveToStorage('ph_currentjob', job)
      saveToStorage('ph_currentscore', null)
      onJobScanned(job)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Job Scanner" subtitle="Extract structured data from any job posting — paste text or URL" />

      <Card className="mb-4">
        <div className="flex border-b border-gray-100 mb-4">
          {['text', 'url'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-[#534AB7] text-[#534AB7] font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t === 'text' ? 'Paste text' : 'URL'}
            </button>
          ))}
        </div>

        {tab === 'text' ? (
          <div className="mb-4">
            <Textarea
              label="Job description text — copy/paste from LinkedIn, Greenhouse, Lever, etc."
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste the full job description here…"
              rows={8}
            />
          </div>
        ) : (
          <div className="mb-4">
            <Input
              label="Job posting URL (works best with public pages — Greenhouse, Lever, Workday, direct career pages)"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://boards.greenhouse.io/company/jobs/..."
            />
            <Alert variant="warning" className="mt-2">
              LinkedIn requires login — use Paste text for LinkedIn jobs.
            </Alert>
          </div>
        )}

        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

        <Button variant="primary" onClick={runScan} disabled={loading}>
          {loading ? <><Spinner /> Scanning…</> : <><i className="ti ti-scan" />Extract job data</>}
        </Button>
      </Card>

      {currentJob?.title && <JobCard job={currentJob} onAddToPipeline={() => onJobScanned(currentJob, true)} />}
    </div>
  )
}

function JobCard({ job, onAddToPipeline }) {
  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-[16px] font-medium text-gray-900">{job.title}</div>
          <div className="text-[13px] text-gray-500 mt-0.5">{job.company} · {job.location}</div>
        </div>
        <Tag variant="purple">{job.roleType}</Tag>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'Seniority', value: job.seniority },
          { label: 'Compensation', value: job.compensation || 'Not specified' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-lg p-3">
            <div className="text-[11px] text-gray-400 mb-1">{label}</div>
            <div className="text-[13px] font-medium">{value}</div>
          </div>
        ))}
      </div>

      {job.requiredStack?.length > 0 && (
        <div className="mb-4">
          <div className="text-[12px] text-gray-500 font-medium mb-2">Required stack / skills</div>
          <div className="flex flex-wrap gap-1.5">
            {job.requiredStack.map(s => <Tag key={s}>{s}</Tag>)}
          </div>
        </div>
      )}

      {job.keyResponsibilities && (
        <div className="mb-4">
          <div className="text-[12px] text-gray-500 font-medium mb-1">Key responsibilities</div>
          <p className="text-[13px] text-gray-600 leading-relaxed">{job.keyResponsibilities}</p>
        </div>
      )}

      {job.postedDate && (
        <div className="text-[11px] text-gray-400 mb-4">Posted: {job.postedDate}</div>
      )}

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <Button variant="primary" size="sm" onClick={onAddToPipeline}>
          <i className="ti ti-plus" />Add to pipeline
        </Button>
        {job.sourceUrl && (
          <a href={job.sourceUrl} target="_blank" rel="noreferrer">
            <Button size="sm"><i className="ti ti-external-link" />View posting</Button>
          </a>
        )}
      </div>
    </Card>
  )
}
