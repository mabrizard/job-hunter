import React, { useState } from 'react'
import { callClaude, parseJSON } from '../lib/api'
import { saveToStorage } from '../lib/state'
import { Card, Button, Alert, Tag, ScoreBadge, PageHeader, DimBar, Spinner } from './UI'

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

DEPRIORIZATION RULE: If 2 or more significant mismatches exist (role type, domain, geography, compensation, seniority) → total score must be below 40 automatically.

Return ONLY valid JSON — no markdown, no preamble:
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
  "analysis": string (3–4 sentences, honest and specific — no generic phrases),
  "flags": [
    { "type": "positive" | "warning" | "dealbreaker", "message": string }
  ]
}`
}

const REC_VARIANT = { GO: 'go', INVESTIGATE: 'investigate', 'NO-GO': 'nogo' }
const FLAG_ICON = { positive: 'ti-check', warning: 'ti-alert-triangle', dealbreaker: 'ti-ban' }
const FLAG_COLOR = { positive: 'text-green-700', warning: 'text-amber-700', dealbreaker: 'text-red-700' }

export default function Qualify({ currentJob, currentScore, profile, onScored, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runQualify() {
    if (!currentJob) return
    setLoading(true)
    setError('')
    try {
      const sys = buildQualifySystem(profile)
      const userMsg = `Score this job:
Title: ${currentJob.title}
Company: ${currentJob.company}
Location: ${currentJob.location}
Role type: ${currentJob.roleType}
Seniority: ${currentJob.seniority}
Compensation: ${currentJob.compensation || 'Not specified'}
Required stack: ${(currentJob.requiredStack || []).join(', ')}
Key responsibilities: ${currentJob.keyResponsibilities || 'Not provided'}`
      const raw = await callClaude(sys, userMsg, 1000)
      const score = parseJSON(raw)
      saveToStorage('ph_currentscore', score)
      onScored(score)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Pre-Qualify Agent" subtitle="Score this posting against your target profile — 6 dimensions, structured output" />

      {!currentJob ? (
        <Alert variant="warning">
          No job loaded.{' '}
          <button onClick={() => onNavigate('scanner')} className="underline cursor-pointer">Go to Job Scanner</button>
          {' '}first to extract a posting.
        </Alert>
      ) : (
        <>
          <Card className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{currentJob.title}</div>
                <div className="text-[12px] text-gray-500">{currentJob.company} · {currentJob.location}</div>
              </div>
              <div className="flex items-center gap-2">
                <Tag variant="purple">{currentJob.roleType}</Tag>
                <Button size="sm" onClick={() => onNavigate('scanner')}>
                  <i className="ti ti-edit" />Change
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-3 mb-5">
            <Button variant="primary" onClick={runQualify} disabled={loading}>
              {loading ? <><Spinner /> Scoring…</> : <><i className="ti ti-bolt" />{currentScore ? 'Re-run' : 'Run qualification'}</>}
            </Button>
            {error && <span className="text-[12px] text-red-600">{error}</span>}
          </div>

          {currentScore && <ScoreCard score={currentScore} onNavigate={onNavigate} />}
        </>
      )}
    </div>
  )
}

function ScoreCard({ score, onNavigate }) {
  return (
    <Card>
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <ScoreBadge score={score.total} size="lg" />
        <div>
          <div className="text-[15px] font-medium">Fit Score — {score.total}/100</div>
          <div className="mt-1">
            <Tag variant={REC_VARIANT[score.recommendation]}>{score.recommendation}</Tag>
          </div>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="mb-5">
        {score.dimensions?.map(d => <DimBar key={d.name} name={d.name} score={d.score} />)}
      </div>

      {/* Dimension notes */}
      <div className="mb-5 space-y-1.5">
        {score.dimensions?.map(d => (
          <div key={d.name} className="text-[12px] text-gray-500">
            <span className="font-medium text-gray-700">{d.name}:</span> {d.note}
          </div>
        ))}
      </div>

      <hr className="border-gray-100 my-4" />

      {/* Analysis */}
      <div className="mb-4">
        <div className="text-[12px] text-gray-500 font-medium mb-2">Analysis</div>
        <p className="text-[13px] text-gray-600 leading-relaxed">{score.analysis}</p>
      </div>

      {/* Flags */}
      {score.flags?.length > 0 && (
        <div className="mb-4">
          <div className="text-[12px] text-gray-500 font-medium mb-2">Flags</div>
          <div className="space-y-1.5">
            {score.flags.map((f, i) => (
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
        <Button variant="primary" size="sm" onClick={() => onNavigate('pipeline')}>
          <i className="ti ti-layout-kanban" />Add to pipeline
        </Button>
        <Button size="sm" onClick={() => onNavigate('adapter')}>
          <i className="ti ti-file-text" />Adapt docs
        </Button>
      </div>
    </Card>
  )
}
