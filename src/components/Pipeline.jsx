import React, { useState } from 'react'
import { PIPELINE_COLUMNS } from '../lib/state'
import { Card, Button, Input, Textarea, Select, ScoreBadge, PageHeader } from './UI'

export default function Pipeline({ pipeline, currentJob, currentScore, onUpdate, onNavigate }) {
  const [selected, setSelected] = useState(null)

  function addCurrentJob() {
    if (!currentJob) return
    const id = currentJob._url || `${currentJob.title}-${currentJob.company}-${Date.now()}`
    if (pipeline.find(p => p.id === id)) return
    const newEntry = {
      id,
      title: currentJob.title,
      company: currentJob.company,
      location: currentJob.location,
      roleType: currentJob.roleType,
      score: currentScore?.total ?? null,
      recommendation: currentScore?.recommendation ?? null,
      status: 'identified',
      contacts: '',
      lastAction: today(),
      nextFollowUp: '',
      notes: '',
      url: currentJob._url || '',
    }
    onUpdate([...pipeline, newEntry])
    setSelected(id)
  }

  function updateEntry(id, field, value) {
    onUpdate(pipeline.map(p => p.id === id ? { ...p, [field]: value, lastAction: today() } : p))
  }

  function removeEntry(id) {
    if (!confirm('Remove from pipeline?')) return
    onUpdate(pipeline.filter(p => p.id !== id))
    if (selected === id) setSelected(null)
  }

  const active = pipeline.filter(p => p.status !== 'closed').length

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="Pipeline"
          subtitle={`${pipeline.length} total · ${active} active`}
        />
        <div className="flex gap-2 mt-1">
          {currentJob && (
            <Button variant="primary" size="sm" onClick={addCurrentJob}>
              <i className="ti ti-plus" />Add current job
            </Button>
          )}
          <Button size="sm" onClick={() => onNavigate('scanner')}>
            <i className="ti ti-search" />Scan new job
          </Button>
        </div>
      </div>

      {pipeline.length === 0 ? (
        <EmptyState onNavigate={onNavigate} />
      ) : (
        <div className="overflow-x-auto">
          <div className="grid gap-3 min-w-[900px]" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {PIPELINE_COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                col={col}
                cards={pipeline.filter(p => p.status === col.id)}
                selected={selected}
                onSelect={setSelected}
              />
            ))}
          </div>
        </div>
      )}

      {selected && (() => {
        const entry = pipeline.find(p => p.id === selected)
        return entry ? (
          <EntryDetail
            entry={entry}
            onUpdate={(field, value) => updateEntry(selected, field, value)}
            onRemove={() => removeEntry(selected)}
            onClose={() => setSelected(null)}
            onNavigate={onNavigate}
          />
        ) : null
      })()}
    </div>
  )
}

function KanbanColumn({ col, cards, selected, onSelect }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 min-h-[280px]">
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{col.label}</span>
        <span className="text-[10px] bg-white rounded-full px-2 py-0.5 text-gray-500 border border-gray-200">{cards.length}</span>
      </div>
      {cards.length === 0 && (
        <div className="text-[11px] text-gray-300 text-center py-4">—</div>
      )}
      {cards.map(c => (
        <KanbanCard key={c.id} card={c} active={selected === c.id} onClick={() => onSelect(selected === c.id ? null : c.id)} />
      ))}
    </div>
  )
}

function KanbanCard({ card, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-2.5 mb-2 cursor-pointer border transition-all ${
        active ? 'border-[#534AB7]' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="text-[12px] font-medium text-gray-900 mb-0.5 truncate">{card.title}</div>
      <div className="text-[11px] text-gray-400 truncate">{card.company}</div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-[10px] text-gray-300">{card.location}</span>
        {card.score != null && <ScoreBadge score={card.score} />}
      </div>
      {card.nextFollowUp && (
        <div className="text-[10px] text-amber-600 mt-1.5">
          <i className="ti ti-clock text-[10px]" /> {card.nextFollowUp}
        </div>
      )}
    </div>
  )
}

function EntryDetail({ entry, onUpdate, onRemove, onClose, onNavigate }) {
  return (
    <Card highlight className="mt-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-[15px] font-medium">{entry.title}</div>
          <div className="text-[12px] text-gray-500">{entry.company} · {entry.location}</div>
        </div>
        <div className="flex gap-1.5">
          {entry.url && (
            <a href={entry.url} target="_blank" rel="noreferrer">
              <Button size="sm"><i className="ti ti-external-link" /></Button>
            </a>
          )}
          <Button size="sm" variant="danger" onClick={onRemove}><i className="ti ti-trash" /></Button>
          <Button size="sm" onClick={onClose}><i className="ti ti-x" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Select
          label="Status"
          value={entry.status}
          onChange={e => onUpdate('status', e.target.value)}
        >
          {PIPELINE_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
        <Input
          label="Next follow-up"
          value={entry.nextFollowUp}
          onChange={e => onUpdate('nextFollowUp', e.target.value)}
          placeholder="YYYY-MM-DD"
        />
      </div>

      <div className="mb-3">
        <Input
          label="Key contacts"
          value={entry.contacts}
          onChange={e => onUpdate('contacts', e.target.value)}
          placeholder="Name, role, LinkedIn URL…"
        />
      </div>

      <Textarea
        label="Notes"
        value={entry.notes}
        onChange={e => onUpdate('notes', e.target.value)}
        placeholder="Interview prep, context, next steps, follow-up notes…"
        rows={4}
      />

      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <Button size="sm" onClick={() => onNavigate('adapter')}>
          <i className="ti ti-file-text" />Adapt docs for this role
        </Button>
        <Button size="sm" onClick={() => onNavigate('outreach')}>
          <i className="ti ti-message" />Write outreach
        </Button>
      </div>
    </Card>
  )
}

function EmptyState({ onNavigate }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <i className="ti ti-layout-kanban text-3xl block mb-3" />
      <p className="text-[13px]">No jobs in pipeline yet.</p>
      <p className="text-[13px] mb-4">Scan and qualify a posting to get started.</p>
      <Button onClick={() => onNavigate('scanner')}>
        <i className="ti ti-search" />Scan a job
      </Button>
    </div>
  )
}

function today() {
  return new Date().toISOString().split('T')[0]
}
