import React, { useState } from 'react'
import { PIPELINE_COLUMNS } from '../lib/state'
import { Card, Button, Input, Textarea, Select, ScoreBadge, Tag, PageHeader, ContactChip } from './UI'

const COL_LABEL_KEYS = {
  identified: 'colIdentified', applied: 'colApplied', inprocess: 'colInProcess',
  offer: 'colOffer', closed: 'colClosed', abandoned: 'colAbandoned',
}

export default function Pipeline({ t, jobs, selectedJobId, onUpdateJob, onDeleteJob, onSelectJob, onNavigate }) {
  const [expandedId, setExpandedId] = useState(selectedJobId)
  const abandonedJobs = jobs.filter(j => j.status === 'abandoned')
  const activeCount = jobs.filter(j => !['closed', 'abandoned'].includes(j.status)).length

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title={t('pipelineTitle')} subtitle={t('pipelineSubtitle', jobs.length, activeCount, abandonedJobs.length)} />
        <Button size="sm" variant="primary" onClick={() => onNavigate('scanner')}>
          <i className="ti ti-plus" />{t('pipelineScanNew')}
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <i className="ti ti-layout-kanban text-3xl block mb-3" />
          <p className="text-[13px] mb-4">{t('pipelineEmpty')}</p>
          <Button onClick={() => onNavigate('scanner')}><i className="ti ti-search" />{t('pipelineScanNew')}</Button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto mb-4">
            <div className="grid gap-3 min-w-[900px]" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {PIPELINE_COLUMNS.filter(c => c.id !== 'abandoned').map(col => {
                const cards = jobs.filter(j => j.status === col.id)
                return (
                  <div key={col.id} className="bg-gray-50 rounded-xl p-3 min-h-[200px]">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{t(COL_LABEL_KEYS[col.id])}</span>
                      <span className="text-[10px] bg-white rounded-full px-2 py-0.5 text-gray-500 border border-gray-200">{cards.length}</span>
                    </div>
                    {cards.length === 0 && <div className="text-[11px] text-gray-300 text-center py-4">—</div>}
                    {cards.map(j => (
                      <KanbanCard key={j.id} job={j} active={expandedId === j.id}
                        onClick={() => { onSelectJob(j.id); setExpandedId(expandedId === j.id ? null : j.id) }} />
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {abandonedJobs.length > 0 && (
            <details className="mb-4">
              <summary className="text-[12px] text-gray-400 cursor-pointer hover:text-gray-600 select-none py-2">
                <span className="font-medium">{t('pipelineAbandoned')} ({abandonedJobs.length})</span> — {t('pipelineClickExpand')}
              </summary>
              <div className="flex flex-wrap gap-2 mt-2">
                {abandonedJobs.map(j => (
                  <div key={j.id} onClick={() => { onSelectJob(j.id); setExpandedId(expandedId === j.id ? null : j.id) }}
                    className={`bg-gray-50 border rounded-lg px-3 py-2 cursor-pointer text-[12px] transition-all ${
                      expandedId === j.id ? 'border-[#534AB7]' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="font-medium text-gray-500">{j.company}</div>
                    <div className="text-gray-400 truncate max-w-[160px]">{j.title}</div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {expandedId && (() => {
            const job = jobs.find(j => j.id === expandedId)
            if (!job) return null
            return <JobDetail t={t} job={job}
              onUpdate={(patch) => onUpdateJob(job.id, patch)}
              onDelete={() => { onDeleteJob(job.id); setExpandedId(null) }}
              onAbandon={() => onUpdateJob(job.id, { status: 'abandoned' })}
              onRestore={() => onUpdateJob(job.id, { status: 'identified' })}
              onNavigate={onNavigate} />
          })()}
        </>
      )}
    </div>
  )
}

function KanbanCard({ job, active, onClick }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-lg p-2.5 mb-2 cursor-pointer border transition-all ${active ? 'border-[#534AB7]' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className="text-[12px] font-medium truncate">{job.title}</div>
      <div className="text-[11px] text-gray-400 truncate">{job.company}</div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-[10px] text-gray-300">{job.location}</span>
        {job.score != null && <ScoreBadge score={job.score} />}
      </div>
      <div className="flex gap-1 mt-1.5 flex-wrap">
        {job.recommendation && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
            job.recommendation === 'GO' ? 'bg-green-100 text-green-700' :
            job.recommendation === 'NO-GO' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
          }`}>{job.recommendation}</span>
        )}
        {job.coverLetter && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EEEDFE] text-[#534AB7]">CL ✓</span>}
        {job.cvTips && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EEEDFE] text-[#534AB7]">CV ✓</span>}
        {job.nextFollowUp && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">📅 {job.nextFollowUp}</span>}
      </div>
    </div>
  )
}

function JobDetail({ t, job, onUpdate, onDelete, onAbandon, onRestore, onNavigate }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isAbandoned = job.status === 'abandoned'

  return (
    <Card highlight>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-[15px] font-medium">{job.title}</div>
          <div className="text-[12px] text-gray-500 mb-2">{job.company} · {job.location}</div>
          <div className="flex flex-wrap gap-2 mb-2">
            <ContactChip label={t('hiringManager')} value={job.hiringManager} onNavigate={() => onNavigate('outreach')} arrowLabel={t('outreachArrow')} />
            <ContactChip label={t('hrContact')} value={job.hrContact} onNavigate={() => onNavigate('outreach')} arrowLabel={t('outreachArrow')} />
          </div>
          {job.score && (
            <div className="flex items-center gap-2">
              <ScoreBadge score={job.score} />
              <Tag variant={job.recommendation === 'GO' ? 'go' : job.recommendation === 'NO-GO' ? 'nogo' : 'investigate'}>{job.recommendation}</Tag>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {job.sourceUrl && <a href={job.sourceUrl} target="_blank" rel="noreferrer"><Button size="sm"><i className="ti ti-external-link" /></Button></a>}
          <Button size="sm" onClick={() => onNavigate('qualify')}><i className="ti ti-bolt" />{t('pipelineScore')}</Button>
          <Button size="sm" onClick={() => onNavigate('adapter')}><i className="ti ti-file-text" />{t('pipelineDocs')}</Button>
          <Button size="sm" onClick={() => onNavigate('outreach')}><i className="ti ti-message" />{t('pipelineOutreach')}</Button>
          {isAbandoned
            ? <Button size="sm" onClick={onRestore}><i className="ti ti-refresh" />{t('pipelineRestore')}</Button>
            : <Button size="sm" onClick={onAbandon}><i className="ti ti-player-stop" />{t('pipelineAbandon')}</Button>
          }
          {!confirmDelete
            ? <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}><i className="ti ti-trash" /></Button>
            : <Button size="sm" variant="danger" onClick={onDelete}>{t('pipelineConfirmDelete')}</Button>
          }
        </div>
      </div>
      <hr className="border-gray-100 my-3" />
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Select label={t('pipelineStatus')} value={job.status} onChange={e => onUpdate({ status: e.target.value })}>
          {PIPELINE_COLUMNS.map(c => <option key={c.id} value={c.id}>{t(COL_LABEL_KEYS[c.id])}</option>)}
        </Select>
        <Input label={t('pipelineFollowUp')} value={job.nextFollowUp || ''} onChange={e => onUpdate({ nextFollowUp: e.target.value })} placeholder="YYYY-MM-DD" />
      </div>
      <div className="mb-3">
        <Input label={t('pipelineContacts')} value={job.contacts || ''} onChange={e => onUpdate({ contacts: e.target.value })} placeholder={t('pipelineContactsPlaceholder')} />
      </div>
      <Textarea label={t('pipelineNotes')} value={job.notes || ''} onChange={e => onUpdate({ notes: e.target.value })} placeholder={t('pipelineNotesPlaceholder')} rows={3} />
      {(job.coverLetter || job.cvTips) && (
        <>
          <hr className="border-gray-100 my-4" />
          <div className="text-[12px] text-gray-500 font-medium mb-3">{t('pipelineSavedDocs')}</div>
          <div className="grid grid-cols-2 gap-3">
            {job.coverLetter && (
              <div className="bg-[#EEEDFE] rounded-lg p-3">
                <div className="text-[11px] text-[#534AB7] font-medium mb-1">{t('pipelineCLSaved')}</div>
                <div className="text-[11px] text-[#7F77DD] line-clamp-3">{job.coverLetter.slice(0, 120)}…</div>
                <button onClick={() => onNavigate('adapter')} className="text-[10px] text-[#534AB7] underline mt-1">{t('pipelineViewEdit')}</button>
              </div>
            )}
            {job.cvTips && (
              <div className="bg-[#EEEDFE] rounded-lg p-3">
                <div className="text-[11px] text-[#534AB7] font-medium mb-1">{t('pipelineCVSaved')}</div>
                <div className="text-[11px] text-[#7F77DD] line-clamp-3">{job.cvTips.slice(0, 120)}…</div>
                <button onClick={() => onNavigate('adapter')} className="text-[10px] text-[#534AB7] underline mt-1">{t('pipelineViewEdit')}</button>
              </div>
            )}
          </div>
        </>
      )}
      {job.scoreDimensions && (
        <>
          <hr className="border-gray-100 my-4" />
          <div className="text-[12px] text-gray-500 font-medium mb-3">{t('pipelineQualDetail')}</div>
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
