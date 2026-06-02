import React, { useState } from 'react'
import { callClaude, parseJSON } from '../lib/api'
import { Card, Button, Textarea, Input, Alert, PageHeader, Spinner } from './UI'

const SCAN_SYSTEM = `You are a job posting parser. You MUST return ONLY a valid JSON object. No apologies, no explanations, no markdown, no preamble. If content is missing, use null. Never refuse — always parse what you have.

For roleType, classify based on ACTUAL RESPONSIBILITIES, not just the job title. A title may say "Pre-Sales" but if the role focuses on post-sale delivery, implementation, or customer success, classify it correctly.
- "Pre-Sales": discovery, demos, POCs, RFPs, deal support BEFORE contract signature
- "Solutions Consulting": technical advisory, solution design, proof of value — pre-sale focused
- "Forward Deployed": embedded in customer environments, hands-on technical deployment, post-sale but highly technical
- "Sales": quota-carrying, pipeline generation, account executive
- "Post-Sales / CS": implementation, onboarding, customer success, delivery after contract
- "Engineering": software development, data science, ML engineering
- "Product": product management, product marketing
- "Other": anything that doesn't fit above

Return exactly this JSON structure:
{
  "title": string,
  "company": string,
  "location": string,
  "roleType": "Pre-Sales" | "Solutions Consulting" | "Forward Deployed" | "Sales" | "Post-Sales / CS" | "Engineering" | "Product" | "Other",
  "seniority": "IC" | "Manager" | "Director" | "VP" | "C-Level" | "Unknown",
  "compensation": string or null,
  "requiredStack": string array (max 12 items),
  "keyResponsibilities": string (2-3 sentence summary),
  "postedDate": string or null,
  "sourceUrl": string or null
}`

export default function Scanner({ onJobScanned }) {
  const [tab, setTab] = useState('text')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
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
      onJobScanned(job)
      setText('')
      setUrl('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Job Scanner" subtitle="Paste a job description — auto-saved to pipeline" />
      <Card>
        <div className="flex border-b border-gray-100 mb-4">
          {['text', 'url'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-[#534AB7] text-[#534AB7] font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >{t === 'text' ? 'Paste text' : 'URL'}</button>
          ))}
        </div>

        {tab === 'text' ? (
          <div className="mb-4">
            <Textarea
              label="Job description — copy/paste from LinkedIn, Greenhouse, Lever, Workday…"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste the full job description here…"
              rows={8}
            />
          </div>
        ) : (
          <div className="mb-4">
            <Input
              label="Job posting URL (public pages — Greenhouse, Lever, Workday, direct career pages)"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://boards.greenhouse.io/..."
            />
            <Alert variant="warning" className="mt-2">
              LinkedIn requires login — use Paste text for LinkedIn jobs.
            </Alert>
          </div>
        )}

        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

        <Button variant="primary" onClick={runScan} disabled={loading}>
          {loading ? <><Spinner /> Scanning…</> : <><i className="ti ti-scan" />Extract & save to pipeline</>}
        </Button>

        <p className="text-[11px] text-gray-400 mt-2">Job is automatically added to your pipeline and you'll be taken to Pre-Qualify.</p>
      </Card>
    </div>
  )
}
