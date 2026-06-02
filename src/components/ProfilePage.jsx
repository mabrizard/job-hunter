import React, { useState } from 'react'
import { Card, Button, Input, Textarea, Select, Alert, PageHeader } from './UI'

export default function ProfilePage({ profile, onSave }) {
  const [form, setForm] = useState({ ...profile })
  const [saved, setSaved] = useState(false)

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function save() {
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <PageHeader title="My Search Profile" subtitle="Injected as RAG context into every agent call — keep this accurate and specific" />

      <Alert variant="info" className="mb-5">
        This profile is the single source of truth for all AI modules. The more specific, the better the scoring and document generation.
      </Alert>

      <Card>
        <div className="space-y-4">
          <Input
            label="Your name"
            value={form.name}
            onChange={e => update('name', e.target.value)}
          />

          <Input
            label="Target roles (comma-separated)"
            value={form.targetRoles}
            onChange={e => update('targetRoles', e.target.value)}
            placeholder="Manager Pre-Sales, Director Solutions Consulting, Forward Deployed Manager"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Salary floor (TC)"
              value={form.salaryFloor}
              onChange={e => update('salaryFloor', e.target.value)}
              placeholder="160000"
            />
            <Select
              label="Currency"
              value={form.salaryCurrency}
              onChange={e => update('salaryCurrency', e.target.value)}
            >
              <option value="EUR">EUR €</option>
              <option value="CAD">CAD $</option>
              <option value="USD">USD $</option>
            </Select>
          </div>

          <Textarea
            label="Priority geographies"
            value={form.geos}
            onChange={e => update('geos', e.target.value)}
            placeholder="Québec, Alberta (priority). Toronto, Montréal, Calgary. EMEA/France (fallback). UK excluded."
            rows={3}
          />

          <Textarea
            label="Key differentiating strengths (used in scoring + doc generation)"
            value={form.strengths}
            onChange={e => update('strengths', e.target.value)}
            placeholder="Player/coach, MEDDPICC, C-level, regulated sectors, bilingual FR/EN, AI-native"
            rows={3}
          />

          <Textarea
            label="Dealbreakers (auto-flagged in pre-qualification scoring)"
            value={form.dealbreakers}
            onChange={e => update('dealbreakers', e.target.value)}
            placeholder="UK-only, pure IC, below salary floor, unrelated domain"
            rows={2}
          />

          <Textarea
            label="CV summary (injected as context for cover letters and CV tips)"
            value={form.cvSummary}
            onChange={e => update('cvSummary', e.target.value)}
            placeholder="2–4 sentences summarizing your background, sector expertise, key achievements, and differentiators."
            rows={5}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button variant="primary" onClick={save}>
              <i className="ti ti-check" />Save profile
            </Button>
            {saved && <span className="text-[12px] text-green-700 font-medium">✓ Saved</span>}
          </div>
        </div>
      </Card>
    </div>
  )
}
