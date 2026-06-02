import React, { useState } from 'react'
import { Card, Button, Input, Textarea, Select, Alert, PageHeader } from './UI'

export default function ProfilePage({ t, profile, onSave }) {
  const [form, setForm] = useState({ ...profile })
  const [saved, setSaved] = useState(false)

  function update(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function save() {
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <PageHeader title={t('profileTitle')} subtitle={t('profileSubtitle')} />
      <Alert variant="info" className="mb-5">{t('profileAlert')}</Alert>

      <Card className="mb-4">
        <div className="text-[12px] text-gray-500 font-medium mb-3 uppercase tracking-wide">
          {t('lang') === 'fr' ? 'Coordonnées' : 'Contact details'}
        </div>
        <div className="space-y-3">
          <Input label={t('profileName')} value={form.name || ''} onChange={e => update('name', e.target.value)} placeholder="Marc-Alexandre Brizard" />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('lang') === 'fr' ? 'Téléphone' : 'Phone'} value={form.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="+1 438 000 0000" />
            <Input label="Email" value={form.email || ''} onChange={e => update('email', e.target.value)} placeholder="marc@example.com" />
          </div>
          <Input label="LinkedIn" value={form.linkedin || ''} onChange={e => update('linkedin', e.target.value)} placeholder="linkedin.com/in/marc-alexandre-brizard" />
        </div>
      </Card>

      <Card className="mb-4">
        <div className="text-[12px] text-gray-500 font-medium mb-3 uppercase tracking-wide">
          {t('lang') === 'fr' ? 'Critères de recherche' : 'Search criteria'}
        </div>
        <div className="space-y-3">
          <Input label={t('profileRoles')} value={form.targetRoles || ''} onChange={e => update('targetRoles', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('profileSalary')} value={form.salaryFloor || ''} onChange={e => update('salaryFloor', e.target.value)} placeholder="160000" />
            <Select label={t('profileCurrency')} value={form.salaryCurrency || 'EUR'} onChange={e => update('salaryCurrency', e.target.value)}>
              <option value="EUR">EUR €</option>
              <option value="CAD">CAD $</option>
              <option value="USD">USD $</option>
            </Select>
          </div>
          <Textarea label={t('profileGeos')} value={form.geos || ''} onChange={e => update('geos', e.target.value)} rows={3} />
          <Textarea label={t('profileStrengths')} value={form.strengths || ''} onChange={e => update('strengths', e.target.value)} rows={3} />
          <Textarea label={t('profileDealbreakers')} value={form.dealbreakers || ''} onChange={e => update('dealbreakers', e.target.value)} rows={2} />
        </div>
      </Card>

      <Card className="mb-4">
        <div className="text-[12px] text-gray-500 font-medium mb-3 uppercase tracking-wide">
          {t('lang') === 'fr' ? 'Résumé pour l\'IA' : 'AI context summary'}
        </div>
        <Textarea label={t('profileCVSummary')} value={form.cvSummary || ''} onChange={e => update('cvSummary', e.target.value)} rows={5} />
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={save}><i className="ti ti-check" />{t('profileSaveBtn')}</Button>
        {saved && <span className="text-[12px] text-green-700 font-medium">{t('profileSaved')}</span>}
      </div>
    </div>
  )
}
