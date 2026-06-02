import React, { useState } from 'react'
import { callClaude } from '../lib/api'
import { Card, Button, Alert, Input, Textarea, Select, PageHeader, Spinner } from './UI'

function buildOutreachSystem(profile) {
  return `You are writing LinkedIn connection requests or messages for a senior pre-sales leader.

SENDER (RAG context):
Name: ${profile.name}
Strengths: ${profile.strengths}

RULES — NON-NEGOTIABLE:
- Max 3 sentences per message
- NO flattery ("I love your work", "I've been following you", "I'm impressed by")
- NO template phrases ("I came across your profile", "I hope this message finds you well")
- Sound like a peer, not a job applicant — write as if you already know the person slightly
- Generate exactly 2 variants with different angles (label: Option A / Option B)
- Mirror the language specified by the sender (French or English)`
}

export default function Outreach({ currentJob, profile }) {
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
Context / reason to reach out: ${context || 'No context provided'}
${currentJob ? `Applying to: ${currentJob.title} at ${currentJob.company}` : ''}`
      const text = await callClaude(sys, userMsg, 600)
      setOutput(text)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      <PageHeader title="Outreach Generator" subtitle="LinkedIn messages — 2–3 sentences, peer tone, no flattery, 2 variants" />

      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input
            label="Contact name & role"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            placeholder="Sarah Chen — VP Pre-Sales, Datadog"
          />
          <Select
            label="Language"
            value={lang}
            onChange={e => setLang(e.target.value)}
          >
            <option value="English">English</option>
            <option value="French">French</option>
          </Select>
        </div>

        <div className="mb-3">
          <Textarea
            label="Context / reason to reach out"
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Applying to Director Pre-Sales at Datadog. Want to connect before submitting. We both attended SaaStr Europe 2024. Common connection: Jean-Michel Durand."
            rows={3}
          />
        </div>

        {currentJob && (
          <div className="mb-3 p-2.5 bg-[#EEEDFE] rounded-lg text-[12px] text-[#534AB7]">
            <i className="ti ti-briefcase mr-1" />
            Current job: {currentJob.title} at {currentJob.company}
          </div>
        )}

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

      <div className="mt-4">
        <Alert variant="info">
          Messages are editable above — click directly to adjust before sending.
          Aim for Option A as default; use B if the recipient has a more formal profile.
        </Alert>
      </div>
    </div>
  )
}
