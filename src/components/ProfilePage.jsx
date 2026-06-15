import React, { useState } from 'react'
import { DEFAULT_JUNIOR_PROFILE } from '../lib/state'
import { Card, Button, Input, Textarea, Select, Alert, PageHeader } from './UI'

export default function ProfilePage({ t, profile, onSave }) {
  const [form, setForm] = useState({ ...profile })
  const [saved, setSaved] = useState(false)

  const isJunior = form.mode === 'junior'

  function update(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function switchMode(mode) {
    if (mode === 'junior' && form.mode !== 'junior') {
      setForm({ ...DEFAULT_JUNIOR_PROFILE, name: form.name, phone: form.phone, email: form.email, linkedin: form.linkedin })
    } else if (mode === 'senior' && form.mode !== 'senior') {
      setForm(f => ({ ...f, mode: 'senior' }))
    }
  }

  function save() {
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <PageHeader title={t('profileTitle')} subtitle={t('profileSubtitle')} />

      {/* Mode toggle */}
      <Card className="mb-4">
        <div className="text-[12px] text-gray-500 font-medium mb-3 uppercase tracking-wide">
          {t('lang') === 'fr' ? 'Mode de recherche' : 'Search mode'}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => switchMode('senior')}
            className={`p-3 rounded-xl border-2 text-left transition-all ${!isJunior ? 'border-[#534AB7] bg-[#EEEDFE]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <div className={`text-[13px] font-medium mb-1 ${!isJunior ? 'text-[#3C3489]' : 'text-gray-700'}`}>
              🎯 {t('lang') === 'fr' ? 'Senior / Expérimenté' : 'Senior / Experienced'}
            </div>
            <div className="text-[11px] text-gray-500">
              {t('lang') === 'fr' ? '5+ ans d\'expérience, qualification d\'offres, adaptation CV' : '5+ years experience, job qualification, CV adaptation'}
            </div>
          </button>
          <button onClick={() => switchMode('junior')}
            className={`p-3 rounded-xl border-2 text-left transition-all ${isJunior ? 'border-[#534AB7] bg-[#EEEDFE]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <div className={`text-[13px] font-medium mb-1 ${isJunior ? 'text-[#3C3489]' : 'text-gray-700'}`}>
              🌱 {t('lang') === 'fr' ? 'Junior / Premier emploi' : 'Junior / First job'}
            </div>
            <div className="text-[11px] text-gray-500">
              {t('lang') === 'fr' ? 'Débuter, construire son CV, premiers entretiens' : 'Getting started, building CV, first interviews'}
            </div>
          </button>
        </div>
      </Card>

      {/* Contact details — shared */}
      <Card className="mb-4">
        <div className="text-[12px] text-gray-500 font-medium mb-3 uppercase tracking-wide">
          {t('lang') === 'fr' ? 'Coordonnées' : 'Contact details'}
        </div>
        <div className="space-y-3">
          <Input label={t('profileName')} value={form.name || ''} onChange={e => update('name', e.target.value)} placeholder="Prénom Nom" />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('lang') === 'fr' ? 'Téléphone' : 'Phone'} value={form.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="+33 6 00 00 00 00" />
            <Input label="Email" value={form.email || ''} onChange={e => update('email', e.target.value)} placeholder="prenom@email.com" />
          </div>
          <Input label="LinkedIn" value={form.linkedin || ''} onChange={e => update('linkedin', e.target.value)} placeholder="linkedin.com/in/prenom-nom" />
        </div>
      </Card>

      {isJunior ? (
        // ─── JUNIOR PROFILE ───────────────────────────────────────────────
        <>
          <Card className="mb-4">
            <div className="text-[12px] text-gray-500 font-medium mb-3 uppercase tracking-wide">
              Formation & compétences
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select label="Niveau d'études" value={form.studyLevel || ''} onChange={e => update('studyLevel', e.target.value)}>
                  <option value="">Sélectionner…</option>
                  {['Bac', 'Bac+2', 'Bac+3 (Licence)', 'Bac+4', 'Bac+5 (Master)', 'Doctorat', 'Autodidacte / Bootcamp'].map(v => <option key={v} value={v}>{v}</option>)}
                </Select>
                <Input label="Domaine d'études" value={form.studyDomain || ''} onChange={e => update('studyDomain', e.target.value)} placeholder="Ex: Informatique, Commerce…" />
              </div>
              <Textarea label="Compétences techniques (langages, outils, certifications)" value={form.technicalSkills || ''} onChange={e => update('technicalSkills', e.target.value)}
                placeholder="Ex: Python, SQL, Excel avancé, Salesforce, HubSpot, certification Google Analytics…" rows={3} />
            </div>
          </Card>

          <Card className="mb-4">
            <div className="text-[12px] text-gray-500 font-medium mb-3 uppercase tracking-wide">
              Expériences & recherche
            </div>
            <div className="space-y-3">
              <Textarea label="Expériences (stages, alternance, projets perso, bénévolat, associations)" value={form.extraExperience || ''} onChange={e => update('extraExperience', e.target.value)}
                placeholder="Ex: Stage 6 mois chez X en tant que commercial junior — prospection, démos. Projet perso : app web React déployée sur Vercel. Trésorier association étudiante 200 membres…" rows={4} />
              <Textarea label="Ce qui me différencie (forces, soft skills, passions)" value={form.strengths || ''} onChange={e => update('strengths', e.target.value)}
                placeholder="Ex: Curieux, apprends vite, à l'aise à l'oral, passion tech, bilingue anglais…" rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Type de contrat recherché" value={form.contractTypes || ''} onChange={e => update('contractTypes', e.target.value)}>
                  <option value="">Sélectionner…</option>
                  {['Stage', 'Alternance', 'CDI Junior', 'CDD', 'Freelance / Mission', 'Indifférent'].map(v => <option key={v} value={v}>{v}</option>)}
                </Select>
                <Input label="Zone géographique" value={form.geos || ''} onChange={e => update('geos', e.target.value)} placeholder="Ex: Paris, Lyon, Remote…" />
              </div>
              <Textarea label="Secteurs d'intérêt" value={form.sectors || ''} onChange={e => update('sectors', e.target.value)}
                placeholder="Ex: SaaS, Tech, Conseil, Fintech, E-commerce…" rows={2} />
            </div>
          </Card>

          <Card className="mb-4">
            <div className="text-[12px] text-gray-500 font-medium mb-3 uppercase tracking-wide">
              Résumé libre (optionnel)
            </div>
            <Textarea label="En 2-3 phrases, qui tu es et ce que tu cherches" value={form.cvSummary || ''} onChange={e => update('cvSummary', e.target.value)}
              placeholder="Ex: Étudiant en Master Marketing Digital, passionné par la data et l'expérience client. Je cherche une alternance dans une scale-up SaaS où je pourrai allier créativité et analyse…" rows={4} />
          </Card>
        </>
      ) : (
        // ─── SENIOR PROFILE ───────────────────────────────────────────────
        <>
          <Alert variant="info" className="mb-4">{t('profileAlert')}</Alert>
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
              <Textarea label={t('profileGeos')} value={form.geos || ''} onChange={e => update('geos', e.target.value)} rows={2} />
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
        </>
      )}

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={save}><i className="ti ti-check" />{t('profileSaveBtn')}</Button>
        {saved && <span className="text-[12px] text-green-700 font-medium">{t('profileSaved')}</span>}
      </div>
    </div>
  )
}
