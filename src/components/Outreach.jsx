import React, { useState } from 'react'
import { callClaude } from '../lib/api'
import { Card, Button, Alert, Input, Textarea, Select, PageHeader, Spinner } from './UI'

function buildOutreachSystem(profile) {
  return `You are writing LinkedIn connection requests for a senior pre-sales leader.

SENDER (RAG context):
Name: ${profile.name}
Strengths: ${profile.strengths}

RULES — NON-NEGOTIABLE:
- Max 3 sentences per message
- NO flattery ("I love your work", "I've been following you", "I'm impressed by")
- NO template phrases ("I came across your profile", "I hope this message finds you well")
- Sound like a peer, not a job applicant
- Generate exactly 2 variants (label: Option A / Option B)
- Mirror the specified language (French or English)`
}

export default function Outreach({ selectedJob, jobs, profile, onUpdateJob, onSelectJob, onNavigate }) {
  const [contactName, setContactName] = useState('')
  const [context, setContext] = useState('')
  const [lang, setLang] = useState('English')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (!contactName.trim()) { setError('Enter contact name and role first.'); return }
    setLoading(true)
    setError('')
    try {
      const sys = buildOutreachSystem(profile)
      const userMsg = `Write 2 LinkedIn message variants in ${lang}.
Contact: ${contactName}
Context: ${context || 'No context provided'}
${selectedJob ? `Applying to: ${selectedJob.title} at ${selectedJob.company}` : ''}`
      const text = await callClaude(sys, userMsg, 600)
      setOutput(text)
      // Save to job if one is selected
      if (selectedJob) {
        const msg = { contactName, context, lang, message: text, date: new Date().toISOString() }
        onUpdateJob(selectedJob.id, {
          outreachMessages: [...(selectedJob.outreachMessages || []), msg]
        })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div>
      <PageHeader title="Outreach Generator" subtitle="LinkedIn messages — 2–3 sentences, peer tone, saved to job" />

      <Card className="mb-4">
        {selectedJob ? (
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
            <div>
              <div className="text-[12px] text-[#534AB7] font-medium">Linked to job</div>
              <div className="text-[13px] font-medium">{selectedJob.title} — {selectedJob.company}</div>
            </div>
            {jobs.length > 1 && (
              <Select value={selectedJob.id} onChange={e => onSelectJob(e.target.value)}>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.company}</option>)}
              </Select>
            )}
          </div>
        ) : (
          <Alert variant="info" className="mb-4">No job selected — message won't be saved. <button onClick={() => onNavigate('scanner')} className="underline cursor-pointer">Scan a job first.</button></Alert>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input label="Contact name & role" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Sarah Chen — VP Pre-Sales, Datadog" />
          <Select label="Language" value={lang} onChange={e => setLang(e.target.value)}>
            <option value="English">English</option>
            <option value="French">French</option>
          </Select>
        </div>
        <div className="mb-3">
          <Textarea label="Context / reason to reach out" value={context} onChange={e => setContext(e.target.value)}
            placeholder="Applying to Director Pre-Sales. Common connection: Jean-Michel Durand. Met at SaaStr Europe 2024." rows={3} />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={generate} disabled={loading}>
            {loading ? <><Spinner />Writing…</> : <><i className="ti ti-message" />{output ? 'Regenerate' : 'Generate message'}</>}
          </Button>
          {error && <span className="text-[12px] text-red-600">{error}</span>}
        </div>
      </Card>

      {output && (
        <Card>
          <div className="flex justify-between items-center mb-3">
            <div className="text-[12px] text-gray-500 font-medium">Message variants</div>
            <Button size="sm" onClick={copy}>
              <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />{copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div contentEditable suppressContentEditableWarning
            className="text-[13px] leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 outline-none focus:bg-white focus:ring-1 focus:ring-[#534AB7]">
            {output}
          </div>
        </Card>
      )}

      {/* Past outreach for this job */}
      {selectedJob?.outreachMessages?.length > 0 && (
        <Card className="mt-4">
          <div className="text-[12px] text-gray-500 font-medium mb-3">Previous outreach for this job ({selectedJob.outreachMessages.length})</div>
          <div className="space-y-3">
            {selectedJob.outreachMessages.map((m, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[12px] font-medium">{m.contactName}</span>
                  <span className="text-[11px] text-gray-400">{new Date(m.date).toLocaleDateString()} · {m.lang}</span>
                </div>
                <div className="text-[12px] text-gray-600 whitespace-pre-wrap line-clamp-3">{m.message}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
