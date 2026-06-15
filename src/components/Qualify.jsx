import React, { useState, useEffect } from 'react'
import { callClaude, parseJSON } from '../lib/api'
import { convertToCAD } from '../lib/fx'
import { Card, Button, Alert, Tag, ScoreBadge, PageHeader, DimBar, Spinner, JobSwitcher, FXChip, ContactChip } from './UI'
import { buildEnrichedContext } from '../lib/buildContext'

function buildSeniorSystem(profile, lang) {
  const enriched = buildEnrichedContext(profile, { lang })
  return `You are a senior career coach specializing in pre-sales leadership roles in enterprise SaaS.
Score this job posting against the candidate's target profile.

CANDIDATE PROFILE (RAG context):
- Name: ${profile.name}
- Target roles: ${profile.targetRoles}
- Salary floor: ${profile.salaryFloor} ${profile.salaryCurrency} TC
- Priority geographies: ${profile.geos}
- Key strengths: ${profile.strengths}
- Dealbreakers: ${profile.dealbreakers}
- CV summary: ${profile.cvSummary}

ENRICHED CONTEXT:
${enriched}

DEPRIORIZATION RULE: If 2+ significant mismatches → total score below 40.

Return ONLY valid JSON:
{
  "total": number (0–100),
  "recommendation": "GO" | "INVESTIGATE" | "NO-GO",
  "dimensions": [
    { "name": "Geo fit", "score": number, "note": string },
    { "name": "Role type fit", "score": number, "note": string },
    { "name": "Seniority fit", "score": number, "note": string },
    { "name": "Domain / stack fit", "score": number, "note": string },
    { "name": "Compensation fit", "score": number, "note": string },
    { "name": "Strengths alignment", "score": number, "note": string }
  ],
  "analysis": string (3–4 sentences, honest and specific),
  "flags": [{ "type": "positive"|"warning"|"dealbreaker", "message": string }]
}`
}

function buildJuniorSystem(profile) {
  return `Tu es un conseiller carrière bienveillant et honnête spécialisé dans l'accompagnement des candidats juniors et primo-accédants à l'emploi.
Évalue cette offre d'emploi par rapport au profil du candidat junior.

PROFIL DU CANDIDAT (contexte RAG) :
- Nom : ${profile.name}
- Niveau d'études : ${profile.studyLevel} en ${profile.studyDomain}
- Compétences techniques : ${profile.technicalSkills}
- Expériences : ${profile.extraExperience}
- Forces / soft skills : ${profile.strengths}
- Type de contrat recherché : ${profile.contractTypes}
- Zone géographique : ${profile.geos}
- Secteurs d'intérêt : ${profile.sectors}
- Résumé : ${profile.cvSummary}

Retourne UNIQUEMENT un JSON valide :
{
  "total": number (0–100),
  "recommendation": "POSTULER" | "À EXPLORER" | "PAS MAINTENANT",
  "dimensions": [
    { "name": "Localisation", "score": number, "note": string },
    { "name": "Type de contrat", "score": number, "note": string },
    { "name": "Secteur / domaine", "score": number, "note": string },
    { "name": "Compétences requises", "score": number, "note": string },
    { "name": "Niveau requis", "score": number, "note": string },
    { "name": "Potentiel d'apprentissage", "score": number, "note": string }
  ],
  "analysis": string (3-4 phrases encourageantes et honnêtes — souligne les forces ET les gaps réels),
  "flags": [
    { "type": "positive"|"warning"|"conseil", "message": string }
  ],
  "decoderOffre": string (2-3 phrases : ce que l'entreprise cherche VRAIMENT derrière les mots de l'offre),
  "redFlags": string[] (signaux d'alerte dans l'offre : "dynamique" = pression, pas de salaire affiché, etc. Max 3. Vide si aucun)
}`
}

const REC_VARIANT = {
  GO: 'go', INVESTIGATE: 'investigate', 'NO-GO': 'nogo',
  POSTULER: 'go', 'À EXPLORER': 'investigate', 'PAS MAINTENANT': 'nogo'
}
const FLAG_ICON = { positive: 'ti-check', warning: 'ti-alert-triangle', dealbreaker: 'ti-ban', conseil: 'ti-bulb' }
const FLAG_COLOR = { positive: 'text-green-700', warning: 'text-amber-700', dealbreaker: 'text-red-700', conseil: 'text-blue-600' }

export default function Qualify({ t, selectedJob, jobs, profile, cvText, onUpdateJob, onSelectJob, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fx, setFx] = useState(null)
  const [fxLoading, setFxLoading] = useState(false)

  const isJunior = profile?.mode === 'junior'

  useEffect(() => {
    if (isJunior) return
    async function loadFX() {
      setFxLoading(true)
      try {
        const result = await convertToCAD(parseInt(profile.salaryFloor) || 160000, profile.salaryCurrency || 'EUR')
        setFx(result)
      } catch {}
      setFxLoading(false)
    }
    loadFX()
  }, [profile.salaryFloor, profile.salaryCurrency, isJunior])

  async function runQualify() {
    if (!selectedJob) return
    setLoading(true); setError('')
    try {
      const sys = isJunior ? buildJuniorSystem(profile) : buildSeniorSystem(profile)
      const userMsg = `Évalue cette offre :
Titre : ${selectedJob.title}
Entreprise : ${selectedJob.company}
Lieu : ${selectedJob.location}
Type de rôle : ${selectedJob.roleType}
Niveau : ${selectedJob.seniority}
Rémunération : ${selectedJob.compensation || 'Non précisée'}
Compétences requises : ${(selectedJob.requiredStack || []).join(', ')}
Responsabilités : ${selectedJob.keyResponsibilities || 'Non précisées'}`
      const raw = await callClaude(sys, userMsg, 1200)
      const result = parseJSON(raw)
      onUpdateJob(selectedJob.id, {
        score: result.total,
        recommendation: result.recommendation,
        scoreDimensions: result.dimensions,
        scoreAnalysis: result.analysis,
        scoreFlags: result.flags,
        scoreDecoderOffre: result.decoderOffre || null,
        scoreRedFlags: result.redFlags || [],
        scoreDate: new Date().toISOString(),
      })
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <PageHeader
        title={isJunior ? (t('lang') === 'fr' ? 'Analyse de l\'offre' : 'Job Analysis') : t('qualifyTitle')}
        subtitle={isJunior
          ? (t('lang') === 'fr' ? 'Cette offre est-elle faite pour toi ? Analyse honnête en 6 dimensions' : 'Is this job right for you? Honest analysis across 6 dimensions')
          : t('qualifySubtitle')}
      />

      {jobs.length === 0 ? (
        <Alert variant="warning">{t('noJobsYet')}<button onClick={() => onNavigate('scanner')} className="underline cursor-pointer">{t('scanFirst')}</button></Alert>
      ) : (
        <>
          <JobSwitcher jobs={jobs} selectedId={selectedJob?.id} onSelect={onSelectJob} />

          {!isJunior && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-[12px] text-gray-400">{t('qualifySalaryFloor')}</span>
              <FXChip salaryFloor={profile.salaryFloor} currency={profile.salaryCurrency} cadAmount={fx?.cad} live={fx?.live} loading={fxLoading} t={t} />
            </div>
          )}

          {selectedJob && (
            <>
              <Card className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{selectedJob.title}</div>
                    <div className="text-[12px] text-gray-500 mb-2">{selectedJob.company} · {selectedJob.location}</div>
                    <div className="flex flex-wrap gap-2">
                      <ContactChip label={t('hiringManager')} value={selectedJob.hiringManager} onNavigate={() => onNavigate('outreach')} arrowLabel={t('outreachArrow')} />
                      <ContactChip label={t('hrContact')} value={selectedJob.hrContact} onNavigate={() => onNavigate('outreach')} arrowLabel={t('outreachArrow')} />
                    </div>
                  </div>
                  <Tag variant="purple">{selectedJob.roleType}</Tag>
                </div>
              </Card>

              <div className="flex items-center gap-3 mb-5">
                <Button variant="primary" onClick={runQualify} disabled={loading}>
                  {loading
                    ? <><Spinner />{t('lang') === 'fr' ? 'Analyse…' : 'Analyzing…'}</>
                    : <><i className="ti ti-bolt" />{selectedJob.score ? (t('lang') === 'fr' ? 'Relancer' : 'Re-run') : (isJunior ? (t('lang') === 'fr' ? 'Analyser cette offre' : 'Analyse this job') : t('qualifyRunBtn'))}</>
                  }
                </Button>
                {error && <span className="text-[12px] text-red-600">{error}</span>}
                {selectedJob.scoreDate && <span className="text-[11px] text-gray-400">{t('qualifyLastScored')} {new Date(selectedJob.scoreDate).toLocaleDateString()}</span>}
              </div>

              {selectedJob.score && <ScoreCard job={selectedJob} t={t} isJunior={isJunior} onNavigate={onNavigate} />}
            </>
          )}
        </>
      )}
    </div>
  )
}

function ScoreCard({ job, t, isJunior, onNavigate }) {
  return (
    <Card>
      <div className="flex items-center gap-4 mb-5">
        <ScoreBadge score={job.score} size="lg" />
        <div>
          <div className="text-[15px] font-medium">{isJunior ? (t('lang') === 'fr' ? 'Score de correspondance' : 'Match score') : t('qualifyFitScore')} — {job.score}/100</div>
          <div className="mt-1"><Tag variant={REC_VARIANT[job.recommendation] || 'investigate'}>{job.recommendation}</Tag></div>
        </div>
      </div>

      <div className="mb-5">{job.scoreDimensions?.map(d => <DimBar key={d.name} name={d.name} score={d.score} />)}</div>

      <div className="mb-5 space-y-1.5">
        {job.scoreDimensions?.map(d => (
          <div key={d.name} className="text-[12px] text-gray-500">
            <span className="font-medium text-gray-700">{d.name}:</span> {d.note}
          </div>
        ))}
      </div>

      <hr className="border-gray-100 my-4" />

      <div className="mb-4">
        <div className="text-[12px] text-gray-500 font-medium mb-2">{t('qualifyAnalysis')}</div>
        <p className="text-[13px] text-gray-600 leading-relaxed">{job.scoreAnalysis}</p>
      </div>

      {/* Junior specific — decoder + red flags */}
      {isJunior && job.scoreDecoderOffre && (
        <div className="mb-4">
          <div className="text-[12px] text-blue-600 font-medium mb-2">🔍 {t('lang') === 'fr' ? 'Ce que l\'entreprise cherche vraiment' : 'What the company really wants'}</div>
          <p className="text-[13px] text-blue-800 leading-relaxed bg-blue-50 rounded-lg p-3">{job.scoreDecoderOffre}</p>
        </div>
      )}

      {isJunior && job.scoreRedFlags?.length > 0 && (
        <div className="mb-4">
          <div className="text-[12px] text-amber-600 font-medium mb-2">⚠️ {t('lang') === 'fr' ? 'Points de vigilance dans cette offre' : 'Watch out in this posting'}</div>
          <div className="space-y-1.5">
            {job.scoreRedFlags.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-amber-800 bg-amber-50 rounded-lg p-2">
                <i className="ti ti-alert-triangle text-amber-500 mt-0.5 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {job.scoreFlags?.length > 0 && (
        <div className="mb-4">
          <div className="text-[12px] text-gray-500 font-medium mb-2">{t('qualifyFlags')}</div>
          <div className="space-y-1.5">
            {job.scoreFlags.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px]">
                <i className={`ti ${FLAG_ICON[f.type] || 'ti-info-circle'} ${FLAG_COLOR[f.type] || 'text-gray-500'} text-sm mt-0.5 flex-shrink-0`} />
                <span>{f.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <hr className="border-gray-100 my-4" />
      <div className="flex gap-2 flex-wrap">
        <Button variant="primary" size="sm" onClick={() => onNavigate('adapter')}>
          <i className="ti ti-file-text" />{isJunior ? (t('lang') === 'fr' ? 'Préparer ma candidature' : 'Prepare application') : t('qualifyAdaptDocs')}
        </Button>
        <Button size="sm" onClick={() => onNavigate('pipeline')}>
          <i className="ti ti-layout-kanban" />{t('qualifyViewPipeline')}
        </Button>
      </div>
    </Card>
  )
}
