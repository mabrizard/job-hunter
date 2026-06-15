import React, { useState } from 'react'
import { Card, Button, Input, Textarea, Select, PageHeader, Alert } from './UI'

const EXPERIENCE_TAGS = ['Presales', 'Delivery', 'Management', 'Tech', 'AI', 'ESN', 'Sales', 'Conseil', 'Public Sector', 'SaaS', 'Autre']

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2,7)}` }

// ── Experiences ──────────────────────────────────────────────────────────────

function ExperienceCard({ exp, lang, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false)
  function toggle(tag) {
    const tags = exp.tags || []
    onUpdate({ tags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag] })
  }
  return (
    <Card className="mb-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 cursor-pointer" onClick={() => setOpen(!open)}>
          <div className="flex items-center gap-2">
            <i className={`ti ti-chevron-${open ? 'up' : 'down'} text-gray-400 text-sm`} />
            <div className="font-medium text-[13px]">{exp.employer || (lang === 'fr' ? 'Nouvelle expérience' : 'New experience')}</div>
            {exp.role && <span className="text-[12px] text-gray-400">· {exp.role}</span>}
            {exp.period && <span className="text-[11px] text-gray-300">· {exp.period}</span>}
          </div>
          {!open && (exp.tags||[]).length > 0 && (
            <div className="flex gap-1 mt-1 ml-5">
              {exp.tags.map(t => <span key={t} className="text-[10px] bg-[#EEEDFE] text-[#534AB7] px-1.5 py-0.5 rounded-full">{t}</span>)}
            </div>
          )}
        </div>
        <Button size="sm" variant="danger" onClick={onDelete}><i className="ti ti-trash" /></Button>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Input label={lang === 'fr' ? 'Employeur' : 'Employer'} value={exp.employer||''} onChange={e => onUpdate({employer: e.target.value})} placeholder="ServiceNow" />
            <Input label={lang === 'fr' ? 'Rôle / titre' : 'Role / title'} value={exp.role||''} onChange={e => onUpdate({role: e.target.value})} placeholder="SC Manager" />
            <Input label={lang === 'fr' ? 'Période' : 'Period'} value={exp.period||''} onChange={e => onUpdate({period: e.target.value})} placeholder="2020 – 2026" />
          </div>
          <Textarea label={lang === 'fr' ? 'Ce que j\'y ai fait' : 'What I did there'} value={exp.description||''} onChange={e => onUpdate({description: e.target.value})} rows={3} placeholder={lang === 'fr' ? 'Équipe, responsabilités, contexte…' : 'Team, responsibilities, context…'} />
          <Textarea label={lang === 'fr' ? 'Métriques & réalisations clés (défendables en entretien)' : 'Key metrics & achievements (interview-defensible)'} value={exp.metrics||''} onChange={e => onUpdate({metrics: e.target.value})} rows={2} placeholder={lang === 'fr' ? 'Ex: 114% quota FY24, équipe 12 SCs, deal 5M€…' : 'E.g. 114% quota FY24, team of 12 SCs, €5M deal…'} />
          <div>
            <div className="text-[12px] text-gray-500 font-medium mb-2">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {EXPERIENCE_TAGS.map(tag => (
                <button key={tag} onClick={() => toggle(tag)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    (exp.tags||[]).includes(tag) ? 'bg-[#534AB7] border-[#534AB7] text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>{tag}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Key Metrics ───────────────────────────────────────────────────────────────

function MetricsSection({ metrics, lang, onChange }) {
  function add() { onChange([...metrics, { id: uid(), label: '', value: '' }]) }
  function update(id, patch) { onChange(metrics.map(m => m.id === id ? { ...m, ...patch } : m)) }
  function remove(id) { onChange(metrics.filter(m => m.id !== id)) }
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-[12px] text-gray-500 font-medium uppercase tracking-wide">
          {lang === 'fr' ? 'Chiffres clés' : 'Key metrics'}
        </div>
        <Button size="sm" onClick={add}><i className="ti ti-plus" />{lang === 'fr' ? 'Ajouter' : 'Add'}</Button>
      </div>
      <Alert variant="info" className="mb-3 text-[12px]">
        {lang === 'fr'
          ? 'Champs libres — adaptez les labels à votre métier. Ex: "Années d\'expérience", "Plus grand deal", "Projets livrés", "Audiences atteintes"…'
          : 'Free fields — adapt labels to your profession. E.g. "Years experience", "Largest deal", "Projects delivered", "Audiences reached"…'}
      </Alert>
      {metrics.length === 0 && (
        <div className="text-[12px] text-gray-400 text-center py-4">{lang === 'fr' ? 'Aucun chiffre ajouté.' : 'No metrics yet.'}</div>
      )}
      <div className="space-y-2">
        {metrics.map(m => (
          <div key={m.id} className="flex gap-2 items-center">
            <Input value={m.label} onChange={e => update(m.id, {label: e.target.value})} placeholder={lang === 'fr' ? 'Label (ex: Taille équipe max)' : 'Label (e.g. Max team size)'} />
            <div style={{width: 120, flexShrink: 0}}>
              <Input value={m.value} onChange={e => update(m.id, {value: e.target.value})} placeholder="12" />
            </div>
            <Button size="sm" variant="danger" onClick={() => remove(m.id)}><i className="ti ti-trash" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Repositioning Angles ───────────────────────────────────────────────────────

function AnglesSection({ angles, lang, onChange }) {
  function add() { onChange([...angles, { id: uid(), label: '', description: '' }]) }
  function update(id, patch) { onChange(angles.map(a => a.id === id ? { ...a, ...patch } : a)) }
  function remove(id) { onChange(angles.filter(a => a.id !== id)) }
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-[12px] text-gray-500 font-medium uppercase tracking-wide">
          {lang === 'fr' ? 'Angles de repositionnement' : 'Repositioning angles'}
        </div>
        <Button size="sm" onClick={add}><i className="ti ti-plus" />{lang === 'fr' ? 'Ajouter' : 'Add'}</Button>
      </div>
      <Alert variant="info" className="mb-3 text-[12px]">
        {lang === 'fr'
          ? 'Comment vous positionnez-vous selon le type de poste ? Ex: "Poste Presales Manager", "Poste Delivery/Transformation", "Poste AI Builder"'
          : 'How do you pitch yourself per role type? E.g. "Presales Manager role", "Delivery/Transformation role", "AI Builder role"'}
      </Alert>
      {angles.length === 0 && (
        <div className="text-[12px] text-gray-400 text-center py-4">{lang === 'fr' ? 'Aucun angle ajouté.' : 'No angles yet.'}</div>
      )}
      <div className="space-y-3">
        {angles.map(a => (
          <Card key={a.id} className="relative">
            <Button size="sm" variant="danger" onClick={() => remove(a.id)} className="absolute top-3 right-3"><i className="ti ti-trash" /></Button>
            <div className="space-y-2 pr-10">
              <Input label={lang === 'fr' ? 'Type de poste' : 'Role type'} value={a.label} onChange={e => update(a.id, {label: e.target.value})} placeholder={lang === 'fr' ? 'Ex: Poste Presales Manager' : 'E.g. Presales Manager role'} />
              <Textarea label={lang === 'fr' ? 'Comment je me positionne' : 'How I pitch myself'} value={a.description} onChange={e => update(a.id, {description: e.target.value})} rows={3}
                placeholder={lang === 'fr' ? 'Ex: Je mets en avant mon expérience player/coach, MEDDPICC, équipes 5-12 SCs, secteurs régulés…' : 'E.g. I lead with player/coach experience, MEDDPICC, 5-12 SC teams, regulated sectors…'} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Immigration ───────────────────────────────────────────────────────────────

function ImmigrationSection({ imm, lang, onChange }) {
  function update(patch) { onChange({ ...imm, ...patch }) }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label={lang === 'fr' ? 'Pays de résidence actuel' : 'Current country of residence'} value={imm.residenceCountry||''} onChange={e => update({residenceCountry: e.target.value})} placeholder="France" />
        <Input label={lang === 'fr' ? 'Pays / régions cibles' : 'Target countries / regions'} value={imm.targetCountries||''} onChange={e => update({targetCountries: e.target.value})} placeholder="Canada (QC, AB), EMEA" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label={lang === 'fr' ? 'Autorisé à travailler dans mon pays actuel' : 'Authorized to work in current country'} value={imm.workAuthorized ? 'yes' : 'no'} onChange={e => update({workAuthorized: e.target.value === 'yes'})}>
          <option value="yes">{lang === 'fr' ? 'Oui' : 'Yes'}</option>
          <option value="no">Non / No</option>
        </Select>
        <Select label={lang === 'fr' ? 'Besoin sponsorship dans les pays cibles' : 'Sponsorship needed in target countries'} value={imm.needsSponsorshipTarget||''} onChange={e => update({needsSponsorshipTarget: e.target.value})}>
          <option value="">{lang === 'fr' ? 'Sélectionner…' : 'Select…'}</option>
          <option value="no">{lang === 'fr' ? 'Non — process autonome (CETA, etc.)' : 'No — autonomous process (CETA, etc.)'}</option>
          <option value="yes_employer">{lang === 'fr' ? 'Oui — employeur doit initier' : 'Yes — employer must initiate'}</option>
          <option value="depends">{lang === 'fr' ? 'Dépend du pays' : 'Depends on country'}</option>
        </Select>
      </div>
      <Textarea label={lang === 'fr' ? 'Processus en cours (Express Entry, CETA, visa, etc.)' : 'Process underway (Express Entry, CETA, visa, etc.)'} value={imm.processUnderway||''} onChange={e => update({processUnderway: e.target.value})} rows={2}
        placeholder={lang === 'fr' ? 'Ex: Express Entry file active — CETA applicable (nationalité française, LMIA-exempt). Timeline juillet 2026.' : 'E.g. Express Entry file active — CETA applicable (French national, LMIA-exempt). Timeline July 2026.'} />
      <Input label={lang === 'fr' ? 'Timeline de disponibilité' : 'Availability timeline'} value={imm.availabilityTimeline||''} onChange={e => update({availabilityTimeline: e.target.value})} placeholder={lang === 'fr' ? 'Ex: Disponible juillet 2026, relocation Q3 2026' : 'E.g. Available July 2026, relocation Q3 2026'} />
      <Select label={lang === 'fr' ? 'Comment le présenter dans les candidatures' : 'How to present in applications'} value={imm.howToPresent||'proactive'} onChange={e => update({howToPresent: e.target.value})}>
        <option value="proactive">{lang === 'fr' ? 'Proactif — mentionner dans la cover letter' : 'Proactive — mention in cover letter'}</option>
        <option value="on_request">{lang === 'fr' ? 'Sur demande — uniquement si le formulaire le demande' : 'On request — only if form asks'}</option>
        <option value="interview_only">{lang === 'fr' ? 'En entretien uniquement — ne pas évoquer à l\'écrit' : 'Interview only — avoid in writing'}</option>
      </Select>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfileEnriched({ lang, profile, onSave }) {
  const [form, setForm] = useState({
    experiences: profile.experiences || [],
    keyMetrics: profile.keyMetrics || [],
    repositioningAngles: profile.repositioningAngles || [],
    immigration: profile.immigration || {
      residenceCountry: '', targetCountries: '', workAuthorized: true,
      needsSponsorshipTarget: '', processUnderway: '', availabilityTimeline: '',
      howToPresent: 'proactive',
    },
  })
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('experiences')

  function addExperience() {
    setForm(f => ({ ...f, experiences: [{ id: uid(), employer:'', role:'', period:'', description:'', metrics:'', tags:[] }, ...f.experiences] }))
  }
  function updateExperience(id, patch) {
    setForm(f => ({ ...f, experiences: f.experiences.map(e => e.id === id ? {...e, ...patch} : e) }))
  }
  function deleteExperience(id) {
    setForm(f => ({ ...f, experiences: f.experiences.filter(e => e.id !== id) }))
  }

  function save() {
    onSave({ ...profile, ...form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const TABS = [
    { id: 'experiences', label: lang === 'fr' ? 'Expériences' : 'Experiences', icon: 'ti-briefcase' },
    { id: 'metrics', label: lang === 'fr' ? 'Chiffres clés' : 'Key metrics', icon: 'ti-chart-bar' },
    { id: 'angles', label: lang === 'fr' ? 'Repositionnement' : 'Repositioning', icon: 'ti-adjustments' },
    { id: 'immigration', label: lang === 'fr' ? 'Immigration' : 'Immigration', icon: 'ti-world' },
  ]

  return (
    <div>
      <PageHeader
        title={lang === 'fr' ? 'Profil enrichi' : 'Enriched profile'}
        subtitle={lang === 'fr'
          ? 'Expériences détaillées, chiffres clés, angles de positionnement — injectés dans tous les agents'
          : 'Detailed experiences, key metrics, positioning angles — injected into all AI agents'}
      />

      <Alert variant="info" className="mb-5">
        {lang === 'fr'
          ? 'Ces informations enrichissent le contexte RAG de tous les modules — plus c\'est précis, plus les CV, lettres et analyses sont justes.'
          : 'This enriches the RAG context across all modules — the more specific, the better the CVs, letters, and analyses.'}
      </Alert>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[13px] border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-[#534AB7] text-[#534AB7] font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>
            <i className={`ti ${t.icon} text-sm`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Experiences */}
      {tab === 'experiences' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="text-[12px] text-gray-400">{form.experiences.length} {lang === 'fr' ? 'expérience(s)' : 'experience(s)'}</div>
            <Button variant="primary" size="sm" onClick={addExperience}>
              <i className="ti ti-plus" />{lang === 'fr' ? 'Ajouter une expérience' : 'Add experience'}
            </Button>
          </div>
          {form.experiences.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <i className="ti ti-briefcase text-3xl block mb-3" />
              <p className="text-[13px]">{lang === 'fr' ? 'Aucune expérience ajoutée.' : 'No experiences yet.'}</p>
            </div>
          ) : (
            form.experiences.map(exp => (
              <ExperienceCard key={exp.id} exp={exp} lang={lang}
                onUpdate={patch => updateExperience(exp.id, patch)}
                onDelete={() => deleteExperience(exp.id)} />
            ))
          )}
        </div>
      )}

      {/* Metrics */}
      {tab === 'metrics' && (
        <MetricsSection metrics={form.keyMetrics} lang={lang}
          onChange={m => setForm(f => ({ ...f, keyMetrics: m }))} />
      )}

      {/* Angles */}
      {tab === 'angles' && (
        <AnglesSection angles={form.repositioningAngles} lang={lang}
          onChange={a => setForm(f => ({ ...f, repositioningAngles: a }))} />
      )}

      {/* Immigration */}
      {tab === 'immigration' && (
        <div>
          <div className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-4">
            {lang === 'fr' ? 'Mobilité & immigration' : 'Mobility & immigration'}
          </div>
          <ImmigrationSection imm={form.immigration} lang={lang}
            onChange={imm => setForm(f => ({ ...f, immigration: imm }))} />
        </div>
      )}

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
        <Button variant="primary" onClick={save}><i className="ti ti-check" />{lang === 'fr' ? 'Sauvegarder' : 'Save'}</Button>
        {saved && <span className="text-[12px] text-green-700 font-medium">✓ {lang === 'fr' ? 'Sauvegardé' : 'Saved'}</span>}
      </div>
    </div>
  )
}
