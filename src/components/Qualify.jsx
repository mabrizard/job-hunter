import React, { useState, useEffect } from 'react'
import { callClaude, parseJSON } from '../lib/api'
import { convertToCAD } from '../lib/fx'
import { Card, Button, Alert, Tag, ScoreBadge, PageHeader, DimBar, Spinner, JobSwitcher, FXChip, ContactChip } from './UI'

function buildQualifySystem(profile) {
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

DEPRIORIZATION RULE: If 2+ significant mismatches → total score below 40.

Return ONLY valid JSON:
{
  "total": number (0–100),
  "recommendation": "GO" | "INVESTIGATE" | "NO-GO",
  "dimensions": [
    { "name": "Geo fit",             "score": number, "note": string },
    { "name": "Role type fit",       "score": number, "note": string },
    { "name": "Seniority fit",       "score": number, "note": string },
    { "name": "Domain / stack fit",  "score": number, "note": string },
    { "name": "Compensation fit",    "score": number, "note": string },
    { "name": "Strengths alignment", "score": number, "note": string }
  ],
  "analysis": string (3–4 sentences, honest and specific),
  "flags": [{ "type": "positive"|"warning"|"dealbreaker", "message": string }]
}`
}

const REC_VARIANT = { GO: 'go', INVESTIGATE: 'investigate', 'NO-GO': 'nogo' }
const FLAG_ICON = { positive: 'ti-check', warning: 'ti-alert-triangle', dealbreaker: 'ti-ban' }
const FLAG_COLOR = { positive: 'text-green-700', warning: 'text-amber-700', dealbreaker: 'text-red-700' }

export default function Qualify({ t, selectedJob, jobs, profile, onUpdateJob, onSelectJob, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fx, setFx] = useState(null)
  const [fxLoading, setFxLoading] = useState(false)

  useEffect(() => {
    async function loadFX() {
      setFxLoading(true)
      try {
        const result = await convertToCAD(parseInt(profile.salaryFloor) || 160000, profile.salaryCurrency || 'EUR')
        setFx(result)
      } catch {}
      setFxLoading(false)
    }
    loadFX()
  }, [profile.salaryFloor, profile.salaryCurrency])

  async function runQualify() {
    if (!selectedJob) return
    setLoading(true)
    setError('')
    try {
      const raw = await callClaude(buildQualifySystem(profile), `Score this job:
Title: ${selectedJob.title}
Company: ${selectedJob.company}
Location: ${selectedJob.location}
Role type: ${selectedJob.roleType}
Seniority: ${selectedJob.seniority}
Compensation: ${selectedJob.compensation || 'Not specified'}
Required stack: ${(selectedJob.requiredStack || []).join(', ')}
Key responsibilities: ${selectedJob.keyResponsibilities || 'Not provided'}`, 1000)
      const result = parseJSON(raw)
      onUpdateJob(selectedJob.id, {
        score: result.total, recommendation: result.recommendation,
        scoreDimensions: result.dimensions, scoreAnalysis: result.analysis,
        scoreFlags: result.flags, scoreDate: new Date().toISOString(),
      })
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <PageHeader title={t('qualifyTitle')} subtitle={t('qualifySubtitle')} />
      {jobs.length === 0 ? (
        <Alert variant="warning">{t('noJobsYet')}<button onClick={() => onNavigate('scanner')} className="underline cursor-pointer">{t('scanFirst')}</button></Alert>
      ) : (
        <>
          <JobSwitcher jobs={jobs} selectedId={selectedJob?.id} onSelect={onSelectJob} />
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-gray-400">{t('qualifySalaryFloor')}</span>
            <FXChip salaryFloor={profile.salaryFloor} currency={profile.salaryCurrency} cadAmount={fx?.cad} live={fx?.live} loading={fxLoading} t={t} />
          </div>
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
                  {loading ? <><Spinner />{t('qualifyScoring')}</> : <><i className="ti ti-bolt" />{selectedJob.score ? t('qualifyRerunBtn') : t('qualifyRunBtn')}</>}
                </Button>
                {error && <span className="text-[12px] text-red-600">{error}</span>}
                {selectedJob.scoreDate && <span className="text-[11px] text-gray-400">{t('qualifyLastScored')} {new Date(selectedJob.scoreDate).toLocaleDateString()}</span>}
              </div>
              {selectedJob.score && <ScoreCard job={selectedJob} t={t} onNavigate={onNavigate} />}
            </>
          )}
        </>
      )}
    </div>
  )
}

function ScoreCard({ job, t, onNavigate }) {
  return (
    <Card>
      <div className="flex items-center gap-4 mb-5">
        <ScoreBadge score={job.score} size="lg" />
        <div>
          <div className="text-[15px] font-medium">{t('qualifyFitScore')} — {job.score}/100</div>
          <div className="mt-1"><Tag variant={REC_VARIANT[job.recommendation]}>{job.recommendation}</Tag></div>
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
      {job.scoreFlags?.length > 0 && (
        <div className="mb-4">
          <div className="text-[12px] text-gray-500 font-medium mb-2">{t('qualifyFlags')}</div>
          <div className="space-y-1.5">
            {job.scoreFlags.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px]">
                <i className={`ti ${FLAG_ICON[f.type]} ${FLAG_COLOR[f.type]} text-sm mt-0.5 flex-shrink-0`} />
                <span>{f.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <hr className="border-gray-100 my-4" />
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={() => onNavigate('adapter')}><i className="ti ti-file-text" />{t('qualifyAdaptDocs')}</Button>
        <Button size="sm" onClick={() => onNavigate('pipeline')}><i className="ti ti-layout-kanban" />{t('qualifyViewPipeline')}</Button>
      </div>
    </Card>
  )
}
