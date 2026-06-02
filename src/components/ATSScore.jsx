import React, { useState } from 'react'
import { callClaude, parseJSON } from '../lib/api'
import { Card, Button, Alert, Tag, PageHeader, Spinner, JobSwitcher } from './UI'

function buildATSSystem(cvText) {
  return `You are an ATS (Applicant Tracking System) expert and keyword matching specialist.
${cvText ? `CANDIDATE CV (RAG context):\n${cvText.slice(0, 3000)}\n` : ''}
Analyze the job posting against the CV and return ONLY valid JSON:
{
  "atsScore": number (0-100, overall keyword match),
  "probabilityScore": number (0-100, estimated probability of getting a response/interview),
  "keywordsFound": string[] (important keywords from job that appear in CV, max 15),
  "keywordsMissing": string[] (important keywords from job NOT in CV, max 15),
  "probabilityFactors": [
    { "factor": string, "impact": "positive"|"negative"|"neutral", "note": string }
  ],
  "atsAnalysis": string (2-3 sentences on keyword match quality),
  "probabilityAnalysis": string (2-3 sentences on response probability),
  "quickWins": string[] (3-5 specific things to add/change to improve ATS score, max 5)
}
For probabilityScore, consider: keyword match, seniority alignment, company size, role specificity, time since posting, competition level for role type.`
}

export default function ATSScore({ t, lang, selectedJob, jobs, cvText, onUpdateJob, onSelectJob, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runAnalysis() {
    if (!selectedJob) return
    setLoading(true)
    setError('')
    try {
      const sys = buildATSSystem(cvText)
      const userMsg = `Analyze this job posting:
Title: ${selectedJob.title} at ${selectedJob.company} (${selectedJob.location})
Role type: ${selectedJob.roleType} | Seniority: ${selectedJob.seniority}
Required stack: ${(selectedJob.requiredStack || []).join(', ')}
Responsibilities: ${selectedJob.keyResponsibilities}
Compensation: ${selectedJob.compensation || 'Not specified'}
Posted: ${selectedJob.postedDate || 'Unknown'}
${!cvText ? '\nNote: No CV uploaded — base analysis on typical pre-sales leader profile for this role.' : ''}`
      const raw = await callClaude(sys, userMsg, 1200)
      const result = parseJSON(raw)
      onUpdateJob(selectedJob.id, {
        atsScore: result.atsScore,
        atsKeywords: result,
        atsDate: new Date().toISOString(),
        probabilityScore: result.probabilityScore,
        probabilityFactors: result.probabilityFactors,
        probabilityDate: new Date().toISOString(),
      })
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const hasResults = selectedJob?.atsScore != null
  const data = selectedJob?.atsKeywords

  return (
    <div>
      <PageHeader
        title={lang === 'fr' ? 'ATS & Probabilité' : 'ATS & Probability'}
        subtitle={lang === 'fr' ? 'Score de correspondance ATS + probabilité de réponse' : 'Keyword match score + estimated response probability'}
      />

      {!cvText && (
        <Alert variant="warning" className="mb-4">
          {lang === 'fr'
            ? <>Aucun CV chargé — <button onClick={() => onNavigate('cv')} className="underline cursor-pointer">uploadez votre CV</button> pour un score précis. L'analyse sera basée sur un profil type sinon.</>
            : <>No CV loaded — <button onClick={() => onNavigate('cv')} className="underline cursor-pointer">upload your CV</button> for accurate scoring. Analysis will use a typical profile otherwise.</>
          }
        </Alert>
      )}

      {jobs.length === 0 ? (
        <Alert variant="warning">
          {lang === 'fr' ? 'Aucune offre. ' : 'No jobs yet. '}
          <button onClick={() => onNavigate('scanner')} className="underline cursor-pointer">
            {lang === 'fr' ? 'Scannez une offre d\'abord.' : 'Scan a job first.'}
          </button>
        </Alert>
      ) : (
        <>
          <JobSwitcher jobs={jobs} selectedId={selectedJob?.id} onSelect={onSelectJob} />

          {selectedJob && (
            <>
              <Card className="mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{selectedJob.title}</div>
                    <div className="text-[12px] text-gray-500">{selectedJob.company} · {selectedJob.location}</div>
                  </div>
                  <Tag variant="purple">{selectedJob.roleType}</Tag>
                </div>
              </Card>

              <div className="flex items-center gap-3 mb-5">
                <Button variant="primary" onClick={runAnalysis} disabled={loading}>
                  {loading
                    ? <><Spinner />{lang === 'fr' ? 'Analyse…' : 'Analyzing…'}</>
                    : <><i className="ti ti-scan" />{hasResults ? (lang === 'fr' ? 'Relancer' : 'Re-run') : (lang === 'fr' ? 'Lancer l\'analyse' : 'Run analysis')}</>
                  }
                </Button>
                {error && <span className="text-[12px] text-red-600">{error}</span>}
                {selectedJob.atsDate && (
                  <span className="text-[11px] text-gray-400">
                    {lang === 'fr' ? 'Analysé le' : 'Analyzed'}: {new Date(selectedJob.atsDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {hasResults && data && <ResultCards data={data} job={selectedJob} lang={lang} onNavigate={onNavigate} />}
            </>
          )}
        </>
      )}
    </div>
  )
}

function ScoreRing({ score, label, color }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#F1EFE8" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[18px] font-medium" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="text-[11px] text-gray-500 mt-1 text-center">{label}</div>
    </div>
  )
}

function ResultCards({ data, job, lang, onNavigate }) {
  const IMPACT_COLOR = { positive: 'text-green-700', negative: 'text-red-600', neutral: 'text-gray-500' }
  const IMPACT_ICON = { positive: 'ti-trending-up', negative: 'ti-trending-down', neutral: 'ti-minus' }

  return (
    <div className="space-y-4">
      {/* Score rings */}
      <Card>
        <div className="flex justify-around py-2">
          <ScoreRing score={data.atsScore} label={lang === 'fr' ? 'Score ATS' : 'ATS Score'} color="#534AB7" />
          <ScoreRing score={data.probabilityScore} label={lang === 'fr' ? 'Prob. réponse' : 'Response prob.'} color={data.probabilityScore >= 60 ? '#639922' : data.probabilityScore >= 35 ? '#BA7517' : '#E24B4A'} />
        </div>
      </Card>

      {/* Keywords */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="text-[12px] text-green-700 font-medium mb-2">
            ✓ {lang === 'fr' ? 'Mots-clés présents' : 'Keywords found'} ({data.keywordsFound?.length || 0})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.keywordsFound?.map(k => (
              <span key={k} className="text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{k}</span>
            ))}
          </div>
        </Card>
        <Card>
          <div className="text-[12px] text-red-600 font-medium mb-2">
            ✗ {lang === 'fr' ? 'Mots-clés manquants' : 'Keywords missing'} ({data.keywordsMissing?.length || 0})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.keywordsMissing?.map(k => (
              <span key={k} className="text-[11px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">{k}</span>
            ))}
          </div>
        </Card>
      </div>

      {/* ATS Analysis */}
      <Card>
        <div className="text-[12px] text-gray-500 font-medium mb-2">{lang === 'fr' ? 'Analyse ATS' : 'ATS Analysis'}</div>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-4">{data.atsAnalysis}</p>

        {data.quickWins?.length > 0 && (
          <>
            <div className="text-[12px] text-[#534AB7] font-medium mb-2">
              ⚡ {lang === 'fr' ? 'Actions rapides pour améliorer le score' : 'Quick wins to improve score'}
            </div>
            <ul className="space-y-1.5">
              {data.quickWins.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600">
                  <span className="text-[#534AB7] font-medium flex-shrink-0">{i + 1}.</span>
                  {w}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {/* Probability factors */}
      <Card>
        <div className="text-[12px] text-gray-500 font-medium mb-2">{lang === 'fr' ? 'Facteurs de probabilité' : 'Probability factors'}</div>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-3">{data.probabilityAnalysis}</p>
        <div className="space-y-2">
          {data.probabilityFactors?.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px]">
              <i className={`ti ${IMPACT_ICON[f.impact]} ${IMPACT_COLOR[f.impact]} text-sm mt-0.5 flex-shrink-0`} />
              <div>
                <span className="font-medium">{f.factor}:</span> <span className="text-gray-500">{f.note}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={() => onNavigate('adapter')}>
          <i className="ti ti-file-text" />{lang === 'fr' ? 'Adapter les docs' : 'Adapt docs'}
        </Button>
      </div>
    </div>
  )
}
