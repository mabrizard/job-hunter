import React, { useState } from 'react'
import { PIPELINE_COLUMNS } from '../lib/state'
import { Card, Button, Input, Textarea, Select, ScoreBadge, Tag, PageHeader, Alert } from './UI'

export default function Pipeline({ jobs, selectedJobId, onUpdateJob, onDeleteJob, onSelectJob, onNavigate }) {
  const [expandedId, setExpandedId] = useState(selectedJobId)
  const activeCount = jobs.filter(j => j.status !== 'closed').length

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="Pipeline" subtitle={`${jobs.length} total · ${activeCount} active`} />
        <Button size="sm" variant="primary" onClick={() => onNavigate('scanner')}>
          <i className="ti ti-plus" />Scan new job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <i className="ti ti-layout-kanban text-3xl block mb-3" />
          <p className="text-[13px] mb-4">No jobs yet. Scan a posting to get started.</p>
          <Button onClick={() => onNavigate('scanner')}><i className="ti ti-search" />Scan a job</Button>
        </div>
      ) : (
        <>
          {/* Kanban */}
          <div className="overflow-x-auto mb-6">
            <div className="grid gap-3 min-w-[900px]" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {PIPELINE_COLUMNS.map(col => {
                const cards = jobs.filter(j => j.status === col.id)
                return (
                  <div key={col.id} className="bg-gray-50 rounded-xl p-3 min-h-[200px]">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{col.label}</span>
                      <span className="text-[10px] bg-white rounded-full px-2 py-0.5 text-gray-500 border border-gray-200">{cards.length}</span>
                    </div>
                    {cards.length === 0 && <div className="text-[11px] text-gray-300 text-center py-4">—</div>}
                    {cards.map(j => (
                      <div
                        key={j.id}
                        onClick={() => { onSelectJob(j.id); setExpandedId(expandedId === j.id ? null : j.id) }}
                        className={`bg-white rounded-lg p-2.5 mb-2 cursor-pointer border transition-all ${
                          expandedId === j.id ? 'border-[#534AB7]' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-[12px] font-medium truncate">{j.title}</div>
                        <div className="text-[11px] text-gray-400 truncate">{j.company}</div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[10px] text-gray-300">{j.location}</span>
                          {j.score != null && <ScoreBadge score={j.score} />}
                        </div>
                        {/* Indicators */}
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {j.recommendation && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              j.recommendation === 'GO' ? 'bg-green-100 text-green-700' :
                              j.recommendation === 'NO-GO' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                            }`}>{j.recommendation}</span>
                          )}
                          {j.coverLetter && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EEEDFE] text-[#534AB7]">CL ✓</span>}
                          {j.cvTips && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EEEDFE] text-[#534AB7]">CV ✓</span>}
                          {j.nextFollowUp && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">📅 {j.nextFollowUp}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detail panel for expanded job */}
          {expandedId && (() => {
            const job = jobs.find(j => j.id === expandedId)
            if (!job) return null
            return <JobDetail job={job} onUpdate={(patch) => onUpdateJob(job.id, patch)} onDelete={() => { onDeleteJob(job.id); setExpandedId(null) }} onNavigate={onNavigate} />
          })()}
        </>
      )}
    </div>
  )
}

function JobDetail({ job, onUpdate, onDelete, onNavigate }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <Card highlight>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-[15px] font-medium">{job.title}</div>
          <div className="text-[12px] text-gray-500">{job.company} · {job.location}</div>
          {job.score && (
            <div className="flex items-center gap-2 mt-1.5">
              <ScoreBadge score={job.score} />
              <Tag variant={job.recommendation === 'GO' ? 'go' : job.recommendation === 'NO-GO' ? 'nogo' : 'investigate'}>
                {job.recommendation}
              </Tag>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {job.sourceUrl && (
            <a href={job.sourceUrl} target="_blank" rel="noreferrer">
              <Button size="sm"><i className="ti ti-external-link" /></Button>
            </a>
          )}
          <Button size="sm" onClick={() => onNavigate('qualify')}><i className="ti ti-bolt" />Score</Button>
          <Button size="sm" onClick={() => onNavigate('adapter')}><i className="ti ti-file-text" />Docs</Button>
          <Button size="sm" onClick={() => onNavigate('outreach')}><i className="ti ti-message" />Outreach</Button>
          {!confirmDelete
            ? <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}><i className="ti ti-trash" /></Button>
            : <Button size="sm" variant="danger" onClick={onDelete}>Confirm delete</Button>
          }
        </div>
      </div>

      <hr className="border-gray-100 my-3" />

      {/* Pipeline fields */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Select label="Status" value={job.status} onChange={e => onUpdate({ status: e.target.value })}>
          {PIPELINE_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
        <Input label="Next follow-up" value={job.nextFollowUp || ''} onChange={e => onUpdate({ nextFollowUp: e.target.value })} placeholder="YYYY-MM-DD" />
      </div>
      <div className="mb-3">
        <Input label="Key contacts" value={job.contacts || ''} onChange={e => onUpdate({ contacts: e.target.value })} placeholder="Name, role, LinkedIn…" />
      </div>
      <Textarea label="Notes" value={job.notes || ''} onChange={e => onUpdate({ notes: e.target.value })} placeholder="Interview prep, context, next steps…" rows={3} />

      {/* Saved content previews */}
      {(job.coverLetter || job.cvTips) && (
        <>
          <hr className="border-gray-100 my-4" />
          <div className="text-[12px] text-gray-500 font-medium mb-3">Saved documents</div>
          <div className="grid grid-cols-2 gap-3">
            {job.coverLetter && (
              <div className="bg-[#EEEDFE] rounded-lg p-3">
                <div className="text-[11px] text-[#534AB7] font-medium mb-1">Cover Letter ✓</div>
                <div className="text-[11px] text-[#7F77DD] line-clamp-3">{job.coverLetter.slice(0, 120)}…</div>
                <button onClick={() => onNavigate('adapter')} className="text-[10px] text-[#534AB7] underline mt-1">View / edit</button>
              </div>
            )}
            {job.cvTips && (
              <div className="bg-[#EEEDFE] rounded-lg p-3">
                <div className="text-[11px] text-[#534AB7] font-medium mb-1">CV Tips ✓</div>
                <div className="text-[11px] text-[#7F77DD] line-clamp-3">{job.cvTips.slice(0, 120)}…</div>
                <button onClick={() => onNavigate('adapter')} className="text-[10px] text-[#534AB7] underline mt-1">View / edit</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Score detail */}
      {job.scoreDimensions && (
        <>
          <hr className="border-gray-100 my-4" />
          <div className="text-[12px] text-gray-500 font-medium mb-3">Qualification detail</div>
          <div className="space-y-1">
            {job.scoreDimensions.map(d => (
              <div key={d.name} className="text-[12px] text-gray-500">
                <span className="font-medium text-gray-700">{d.name} ({d.score}):</span> {d.note}
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
