import React, { useState } from 'react'
import { callClaude } from '../lib/api'
import { cleanAIText } from '../lib/cleanText'
import { buildEnrichedContext } from '../lib/buildContext'
import { Card, Button, Alert, Tag, PageHeader, Select, Spinner, JobSwitcher } from './UI'

// ─── SENIOR PROMPTS ───────────────────────────────────────────────────────────

function buildSeniorCLSystem(profile, tone, cvText, refCoverLetter, lang) {
  const enriched = buildEnrichedContext(profile, { lang })
  return `You are an expert cover letter writer for senior pre-sales leaders. Write in a ${tone} style.
CANDIDATE: Name: ${profile.name} | ${[profile.phone, profile.email, profile.linkedin].filter(Boolean).join(' | ')}
Strengths: ${profile.strengths} | CV: ${profile.cvSummary}
${cvText ? `Full CV: ${cvText.slice(0, 2000)}` : ''}
${refCoverLetter ? `Reference style: ${refCoverLetter.slice(0, 1500)}` : ''}

ENRICHED CONTEXT (experiences, metrics, immigration):
${enriched}
RULES: NO generic phrases. NO markdown (no **, no ##). 3 paragraphs: hook, evidence (3 differentiators), close. Max 280 words. Match job language (FR/EN). Peer tone. Start with name + contact header.`
}

function buildSeniorCVSystem(profile, cvText, refCV) {
  return `You are an expert CV advisor for senior pre-sales roles.
CANDIDATE: Strengths: ${profile.strengths} | CV: ${profile.cvSummary}
${cvText ? `Full CV: ${cvText.slice(0, 2000)}` : ''}
${refCV ? `Reference CV: ${refCV.slice(0, 1500)}` : ''}
Provide 6-8 specific actionable CV tips. Numbered list. WHAT to change -> WHY. No markdown. No ** or ##.`
}

// ─── JUNIOR PROMPTS ───────────────────────────────────────────────────────────

function buildJuniorCLSystem(profile, tone) {
  return `Tu es un expert en rédaction de lettres de motivation pour les candidats juniors et primo-accédants à l'emploi. Ton : ${tone}.
CANDIDAT : ${profile.name} | ${[profile.phone, profile.email, profile.linkedin].filter(Boolean).join(' | ')}
Formation : ${profile.studyLevel} en ${profile.studyDomain}
Compétences : ${profile.technicalSkills}
Expériences : ${profile.extraExperience}
Forces : ${profile.strengths}
RÈGLES ABSOLUES :
- PAS de phrases génériques ("Je me permets de vous adresser", "Très motivé(e)", "Challenge")
- PAS de mise en forme markdown (pas de **, pas de ##)
- 3 paragraphes : accroche (pourquoi cette entreprise spécifiquement), valeur (ce que tu apportes avec des exemples concrets tirés des expériences), closing (disponibilité, enthousiasme mesuré, CTA)
- Max 250 mots
- Ton : humain, direct, sans flagornerie
- Commence par le prénom/nom et les coordonnées en en-tête`
}

function buildJuniorCVSystem(profile) {
  return `Tu es un expert en création de CV pour les candidats juniors.
CANDIDAT : Formation : ${profile.studyLevel} en ${profile.studyDomain}
Compétences : ${profile.technicalSkills}
Expériences : ${profile.extraExperience}
Forces : ${profile.strengths}
Génère des conseils concrets pour adapter ou construire un CV pour cette offre.
Format : liste numérotée. QUOI faire → POURQUOI c'est important pour CE poste.
Pas de markdown, pas de ** ou ##. Sois honnête — ne suggère pas d'inventer des expériences.`
}

function buildJuniorCVFromScratch(profile, job) {
  return `Tu es un expert en création de CV pour candidats juniors. Construis un CV complet en texte brut.
CANDIDAT : ${profile.name} | ${[profile.phone, profile.email, profile.linkedin].filter(Boolean).join(' | ')}
Formation : ${profile.studyLevel} en ${profile.studyDomain}
Compétences : ${profile.technicalSkills}
Expériences : ${profile.extraExperience}
Forces : ${profile.strengths}
POSTE VISÉ : ${job.title} chez ${job.company}
RÈGLES :
- CV en texte brut structuré (sections claires : Profil, Formation, Expériences, Compétences, Centres d'intérêt)
- Valorise TOUT ce qui est réel : projets perso, stages courts, bénévolat, associations
- Adapte le profil au poste sans inventer
- Pas de markdown, pas de ** ou ##
- Max 1 page de contenu`
}

async function exportToPDF(text, filename) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none'
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>body{font-family:Georgia,serif;font-size:11pt;line-height:1.7;margin:2.5cm 3cm;color:#1a1a1a}p{margin:0 0 .8em}@page{margin:2cm;size:A4}</style>
  </head><body>${text.split('\n').filter(l=>l.trim()).map(l=>`<p>${l}</p>`).join('')}</body></html>`)
  doc.close()
  setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000) }, 500)
}

const SENIOR_TONES = [
  { value: 'executive, confident, direct', label: 'Exécutif — direct & percutant' },
  { value: 'collaborative, human, warm', label: 'Collaboratif — humain & chaleureux' },
  { value: 'technical, precise, results-focused', label: 'Technique — précis & orienté résultats' },
]

const JUNIOR_TONES = [
  { value: 'enthousiaste, direct, humain — sans flagornerie', label: 'Direct & humain' },
  { value: 'professionnel mais accessible, motivé sans en faire trop', label: 'Professionnel & accessible' },
  { value: 'créatif, différent des candidatures classiques', label: 'Créatif & différenciant' },
]

export default function Adapter({ t, selectedJob, jobs, profile, cvText, refCV, refCoverLetter, documents, onUpdateJob, onSelectJob, onNavigate }) {
  const [tab, setTab] = useState('cl')
  const [juniorCVMode, setJuniorCVMode] = useState('tips') // 'tips' | 'scratch'
  const [tone, setTone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedRefDocId, setSelectedRefDocId] = useState('')

  const isJunior = profile?.mode === 'junior'
  const TONES = isJunior ? JUNIOR_TONES : SENIOR_TONES
  const selectedRefDoc = documents?.find(d => d.id === selectedRefDocId)
  const effectiveTone = tone || TONES[0].value

  async function generate() {
    if (!selectedJob) return
    setLoading(true); setError('')
    try {
      let text = ''
      if (tab === 'cl') {
        const sys = isJunior
          ? buildJuniorCLSystem(profile, effectiveTone)
          : buildSeniorCLSystem(profile, effectiveTone, cvText, refCoverLetter || selectedRefDoc?.content, t('lang'))
        const userMsg = `${isJunior ? 'Rédige une lettre de motivation pour' : 'Write a cover letter for'}: ${selectedJob.title} ${isJunior ? 'chez' : 'at'} ${selectedJob.company} (${selectedJob.location})
${isJunior ? 'Responsabilités' : 'Responsibilities'}: ${selectedJob.keyResponsibilities}
${isJunior ? 'Requis' : 'Required'}: ${(selectedJob.requiredStack||[]).join(', ')}`
        const raw = await callClaude(sys, userMsg, 1000)
        text = cleanAIText(raw)

        const history = selectedJob.coverLetterHistory || []
        const updatedHistory = selectedJob.coverLetter
          ? [...history, { text: selectedJob.coverLetter, tone: selectedJob.coverLetterTone, date: selectedJob.coverLetterDate }].slice(-5)
          : history
        onUpdateJob(selectedJob.id, { coverLetter: text, coverLetterTone: effectiveTone, coverLetterDate: new Date().toISOString(), coverLetterHistory: updatedHistory })

      } else {
        // CV tab
        if (isJunior && juniorCVMode === 'scratch') {
          const sys = buildJuniorCVFromScratch(profile, selectedJob)
          const raw = await callClaude(sys, `Construis le CV pour : ${selectedJob.title} chez ${selectedJob.company}`, 1500)
          text = cleanAIText(raw)
        } else {
          const sys = isJunior
            ? buildJuniorCVSystem(profile)
            : buildSeniorCVSystem(profile, cvText, refCV || selectedRefDoc?.content)
          const userMsg = `${isJunior ? 'Conseils CV pour' : 'CV tips for'}: ${selectedJob.title} ${isJunior ? 'chez' : 'at'} ${selectedJob.company}
${isJunior ? 'Type de rôle' : 'Role type'}: ${selectedJob.roleType} | ${isJunior ? 'Niveau' : 'Seniority'}: ${selectedJob.seniority}
${isJunior ? 'Requis' : 'Requirements'}: ${(selectedJob.requiredStack||[]).join(', ')}
${isJunior ? 'Responsabilités' : 'Responsibilities'}: ${selectedJob.keyResponsibilities}`
          const raw = await callClaude(sys, userMsg, 1000)
          text = cleanAIText(raw)
        }
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

  function restoreVersion(version) {
    const history = selectedJob.coverLetterHistory || []
    const updatedHistory = selectedJob.coverLetter
      ? [...history, { text: selectedJob.coverLetter, tone: selectedJob.coverLetterTone, date: selectedJob.coverLetterDate }]
      : history
    onUpdateJob(selectedJob.id, {
      coverLetter: version.text, coverLetterTone: version.tone, coverLetterDate: version.date,
      coverLetterHistory: updatedHistory.filter(h => h.date !== version.date).slice(-5),
    })
    setShowHistory(false)
  }

  const output = tab === 'cl' ? selectedJob?.coverLetter : selectedJob?.cvTips
  const outputDate = tab === 'cl' ? selectedJob?.coverLetterDate : selectedJob?.cvTipsDate
  const history = selectedJob?.coverLetterHistory || []

  return (
    <div>
      <PageHeader
        title={isJunior ? (t('lang') === 'fr' ? 'Préparer ma candidature' : 'Prepare my application') : t('adapterTitle')}
        subtitle={isJunior
          ? (t('lang') === 'fr' ? 'Lettre de motivation et CV adaptés à l\'offre' : 'Cover letter and CV tailored to the job')
          : t('adapterSubtitle')}
      />

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

          {/* Tabs */}
          <div className="flex border-b border-gray-100 mb-4">
            {[
              { id: 'cl', label: isJunior ? (t('lang') === 'fr' ? 'Lettre de motivation' : 'Cover Letter') : t('adapterTabCL'), saved: !!selectedJob.coverLetter },
              { id: 'cv', label: isJunior ? (t('lang') === 'fr' ? 'CV' : 'CV') : t('adapterTabCV'), saved: !!selectedJob.cvTips },
            ].map(tabItem => (
              <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
                className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${tab === tabItem.id ? 'border-[#534AB7] text-[#534AB7] font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                {tabItem.label}
                {tabItem.saved && <span className="text-[10px] bg-[#EEEDFE] text-[#534AB7] px-1.5 py-0.5 rounded">{t('adapterSaved')}</span>}
              </button>
            ))}
          </div>

          <Card className="mb-4">
            {/* Tone selector */}
            <div className="mb-3">
              <Select label={t('adapterToneLabel')} value={tone || TONES[0].value} onChange={e => setTone(e.target.value)}>
                {TONES.map(to => <option key={to.value} value={to.value}>{to.label}</option>)}
              </Select>
            </div>

            {/* Junior CV mode toggle */}
            {isJunior && tab === 'cv' && (
              <div className="mb-3">
                <div className="text-[12px] text-gray-500 font-medium mb-2">
                  {t('lang') === 'fr' ? 'Mode CV' : 'CV mode'}
                </div>
                <div className="flex gap-2">
                  {[
                    { id: 'tips', label: t('lang') === 'fr' ? '💡 Conseils d\'adaptation' : '💡 Adaptation tips' },
                    { id: 'scratch', label: t('lang') === 'fr' ? '✨ Construire depuis zéro' : '✨ Build from scratch' },
                  ].map(m => (
                    <button key={m.id} onClick={() => setJuniorCVMode(m.id)}
                      className={`px-3 py-1.5 text-[12px] rounded-lg border transition-all ${juniorCVMode === m.id ? 'bg-[#534AB7] border-[#534AB7] text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reference doc selector for seniors */}
            {!isJunior && documents?.length > 0 && (
              <div className="mb-3">
                <div className="text-[12px] text-gray-500 font-medium mb-2">
                  {t('lang') === 'fr' ? 'Document de référence' : 'Reference document'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setSelectedRefDocId('')}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${!selectedRefDocId ? 'bg-[#534AB7] border-[#534AB7] text-white' : 'bg-white border-gray-200 text-gray-500'}`}>
                    {t('lang') === 'fr' ? 'Aucun' : 'None'}
                  </button>
                  {documents.map(d => (
                    <button key={d.id} onClick={() => setSelectedRefDocId(d.id === selectedRefDocId ? '' : d.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${selectedRefDocId === d.id ? 'bg-[#534AB7] border-[#534AB7] text-white' : 'bg-white border-gray-200 text-gray-500'}`}>
                      {d.name}
                      {d.tags?.map(tag => <span key={tag} className="opacity-70">· {tag}</span>)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="primary" onClick={generate} disabled={loading}>
                {loading
                  ? <><Spinner />{t('lang') === 'fr' ? 'Rédaction…' : 'Writing…'}</>
                  : <><i className={`ti ${tab === 'cl' ? 'ti-wand' : 'ti-list-check'}`} />
                    {output ? (t('lang') === 'fr' ? 'Régénérer' : 'Regenerate') : (tab === 'cl' ? (t('lang') === 'fr' ? 'Générer la lettre' : 'Generate cover letter') : (isJunior && juniorCVMode === 'scratch' ? (t('lang') === 'fr' ? 'Construire mon CV' : 'Build my CV') : (t('lang') === 'fr' ? 'Générer les conseils' : 'Generate CV tips')))}</>
                }
              </Button>
              {tab === 'cl' && history.length > 0 && (
                <Button size="sm" onClick={() => setShowHistory(!showHistory)}>
                  <i className="ti ti-history" /> {history.length} {t('lang') === 'fr' ? 'version(s)' : 'version(s)'}
                </Button>
              )}
              {error && <span className="text-[12px] text-red-600">{error}</span>}
            </div>
          </Card>

          {/* Version history */}
          {showHistory && history.length > 0 && (
            <Card className="mb-4">
              <div className="text-[12px] text-gray-500 font-medium mb-3">{t('lang') === 'fr' ? 'Versions précédentes' : 'Previous versions'}</div>
              <div className="space-y-2">
                {[...history].reverse().map(v => (
                  <div key={v.date} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-gray-400 mb-1">{new Date(v.date).toLocaleString()}</div>
                      <div className="text-[12px] text-gray-600 line-clamp-2">{v.text?.slice(0, 100)}…</div>
                    </div>
                    <Button size="sm" onClick={() => restoreVersion(v)}><i className="ti ti-restore" />{t('lang') === 'fr' ? 'Restaurer' : 'Restore'}</Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {output && (
            <Card>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-[12px] text-gray-500 font-medium">
                    {tab === 'cl' ? (t('lang') === 'fr' ? 'Lettre de motivation' : 'Cover letter') : (isJunior && juniorCVMode === 'scratch' ? (t('lang') === 'fr' ? 'Mon CV' : 'My CV') : (t('lang') === 'fr' ? 'Conseils CV' : 'CV tips'))}
                  </div>
                  {outputDate && <span className="text-[11px] text-gray-400">· {new Date(outputDate).toLocaleDateString()}</span>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={copy}><i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />{copied ? t('copied') : t('copy')}</Button>
                  {(tab === 'cl' || (isJunior && juniorCVMode === 'scratch')) && (
                    <Button size="sm" onClick={() => exportToPDF(output, `${tab === 'cl' ? 'lettre' : 'cv'}-${selectedJob.company}`)}>
                      <i className="ti ti-file-type-pdf" />PDF
                    </Button>
                  )}
                </div>
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
