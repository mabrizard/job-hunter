import React, { useState } from 'react'
import { callClaude } from '../lib/api'
import { Card, Button, Alert, Input, Textarea, Select, PageHeader, Spinner, JobSwitcher } from './UI'

function buildOutreachSystem(profile) {
  const isJunior = profile?.mode === 'junior'
  if (isJunior) {
    return `Tu rédiges des messages LinkedIn pour un candidat junior en recherche d'emploi.
EXPÉDITEUR : ${profile.name} | Formation : ${profile.studyLevel} en ${profile.studyDomain} | Forces : ${profile.strengths}
RÈGLES : Max 3 phrases. PAS de flatterie. PAS de formules génériques. Objectif : demander un conseil, pas directement un emploi. Ton naturel. 2 variantes (Option A / Option B). Langue selon la sélection.`
  }
  return `You are writing LinkedIn messages for a senior pre-sales leader.
SENDER: ${profile.name} | Strengths: ${profile.strengths}
RULES: Max 3 sentences. NO flattery. NO templates. Peer tone. 2 variants (Option A / Option B). Mirror the specified language.`
}

export default function Outreach({ t, selectedJob, jobs, profile, onUpdateJob, onSelectJob, onNavigate }) {
  const isJunior = profile?.mode === 'junior'
  const [contactName, setContactName] = useState('')
  const [context, setContext] = useState('')
  const [lang, setLang] = useState('English')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (!contactName.trim()) { setError(t('outreachNoJob')); return }
    setLoading(true); setError('')
    try {
      const text = await callClaude(buildOutreachSystem(profile),
        `Write 2 LinkedIn message variants in ${lang}.\nContact: ${contactName}\nContext: ${context || 'No context'}\n${selectedJob ? `Applying to: ${selectedJob.title} at ${selectedJob.company}` : ''}`, 600)
      setOutput(text)
      if (selectedJob) {
        onUpdateJob(selectedJob.id, {
          outreachMessages: [...(selectedJob.outreachMessages || []),
            { contactName, context, lang, message: text, date: new Date().toISOString() }]
        })
      }
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function copy() {
    navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div>
      <PageHeader title={t('outreachTitle')} subtitle={t('outreachSubtitle')} />
      <Card className="mb-4">
        <JobSwitcher jobs={jobs} selectedId={selectedJob?.id} onSelect={onSelectJob} />
        {selectedJob ? (
          <div className="mb-4 pb-3 border-b border-gray-100">
            <div className="text-[12px] text-[#534AB7] font-medium">{t('outreachLinkedTo')}</div>
            <div className="text-[13px] font-medium">{selectedJob.title} — {selectedJob.company}</div>
          </div>
        ) : (
          <Alert variant="info" className="mb-4">
            {t('outreachNoJob')}<button onClick={() => onNavigate('scanner')} className="underline cursor-pointer">{t('scanFirst')}</button>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input label={t('outreachContactLabel')} value={contactName} onChange={e => setContactName(e.target.value)} placeholder={t('outreachContactPlaceholder')} />
          <Select label={t('outreachLangLabel')} value={lang} onChange={e => setLang(e.target.value)}>
            <option value="English">English</option>
            <option value="French">Français</option>
          </Select>
        </div>
        <div className="mb-3">
          <Textarea label={t('outreachContextLabel')} value={context} onChange={e => setContext(e.target.value)} placeholder={t('outreachContextPlaceholder')} rows={3} />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={generate} disabled={loading}>
            {loading ? <><Spinner />{t('outreachWriting')}</> : <><i className="ti ti-message" />{output ? t('outreachRegenBtn') : t('outreachGenBtn')}</>}
          </Button>
          {error && <span className="text-[12px] text-red-600">{error}</span>}
        </div>
      </Card>

      {output && (
        <Card>
          <div className="flex justify-between items-center mb-3">
            <div className="text-[12px] text-gray-500 font-medium">{t('outreachVariants')}</div>
            <Button size="sm" onClick={copy}><i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />{copied ? t('copied') : t('copy')}</Button>
          </div>
          <div contentEditable suppressContentEditableWarning
            className="text-[13px] leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 outline-none focus:bg-white focus:ring-1 focus:ring-[#534AB7]">
            {output}
          </div>
        </Card>
      )}

      {selectedJob?.outreachMessages?.length > 0 && (
        <Card className="mt-4">
          <div className="text-[12px] text-gray-500 font-medium mb-3">{t('outreachPast')} ({selectedJob.outreachMessages.length})</div>
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
