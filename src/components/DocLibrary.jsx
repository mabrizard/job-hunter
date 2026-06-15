import React, { useState } from 'react'
import { extractTextFromPDF } from '../lib/pdfReader'
import { exportDocx } from '../lib/exportDocx'
import { Card, Button, Alert, Input, PageHeader, Spinner } from './UI'

const PRESET_TAGS = ['Pre-Sales', 'Delivery', 'Forward Deployed', 'Solutions Consulting', 'FR', 'EN', 'Canada', 'EMEA', 'Template', 'Cover Letter']

function TagPicker({ selected, onChange }) {
  const [custom, setCustom] = useState('')
  function toggle(tag) {
    onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag])
  }
  function addCustom() {
    const t = custom.trim()
    if (t && !selected.includes(t)) onChange([...selected, t])
    setCustom('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {PRESET_TAGS.map(tag => (
          <button key={tag} onClick={() => toggle(tag)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
              selected.includes(tag)
                ? 'bg-[#534AB7] border-[#534AB7] text-white'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>{tag}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg outline-none focus:border-[#534AB7]"
          placeholder="Tag personnalisé…"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
        />
        <Button size="sm" onClick={addCustom}>+</Button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map(t => (
            <span key={t} className="inline-flex items-center gap-1 text-[11px] bg-[#EEEDFE] text-[#534AB7] px-2 py-0.5 rounded-full">
              {t}
              <button onClick={() => toggle(t)} className="hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function AddDocForm({ lang, onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [tags, setTags] = useState([])
  const [content, setContent] = useState('')
  const [tab, setTab] = useState('paste')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setError('PDF uniquement'); return }
    setLoading(true)
    try {
      const text = await extractTextFromPDF(file)
      setContent(text)
      if (!name) setName(file.name.replace('.pdf', ''))
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function submit() {
    if (!name.trim() || !content.trim()) { setError(lang === 'fr' ? 'Nom et contenu requis' : 'Name and content required'); return }
    onAdd({
      id: `doc_${Date.now()}`,
      name: name.trim(),
      tags,
      content: content.trim(),
      created_at: new Date().toISOString(),
    })
  }

  return (
    <Card className="mb-4 border-[#534AB7]">
      <div className="text-[13px] font-medium mb-4">{lang === 'fr' ? 'Nouveau document' : 'New document'}</div>

      <div className="mb-3">
        <Input label={lang === 'fr' ? 'Nom du document' : 'Document name'} value={name} onChange={e => setName(e.target.value)}
          placeholder={lang === 'fr' ? 'Ex: CV Pre-Sales Manager EN' : 'E.g. CV Pre-Sales Manager EN'} />
      </div>

      <div className="mb-3">
        <div className="text-[12px] text-gray-500 font-medium mb-2">Tags</div>
        <TagPicker selected={tags} onChange={setTags} />
      </div>

      <div className="flex border-b border-gray-100 mb-3">
        {['paste', 'pdf'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-[12px] border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-[#534AB7] text-[#534AB7] font-medium' : 'border-transparent text-gray-400'
            }`}>{t === 'paste' ? (lang === 'fr' ? 'Coller texte' : 'Paste text') : 'PDF'}</button>
        ))}
      </div>

      {tab === 'paste' ? (
        <textarea className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg outline-none focus:border-[#534AB7] resize-y mb-3"
          rows={8} value={content} onChange={e => setContent(e.target.value)}
          placeholder={lang === 'fr' ? 'Collez le contenu ici…' : 'Paste content here…'} />
      ) : (
        <div className="mb-3">
          <label className="flex items-center gap-3 border border-dashed border-gray-200 rounded-lg px-4 py-3 cursor-pointer hover:border-[#534AB7] transition-all">
            <i className="ti ti-file-type-pdf text-gray-300 text-xl" />
            <span className="text-[12px] text-gray-500">
              {loading ? <><Spinner /> {lang === 'fr' ? 'Extraction…' : 'Extracting…'}</> : (lang === 'fr' ? 'Sélectionner un PDF' : 'Select a PDF')}
            </span>
            <input type="file" accept=".pdf" onChange={handleFile} className="hidden" />
          </label>
          {content && <div className="mt-2 text-[11px] text-green-700">✓ {content.length.toLocaleString()} {lang === 'fr' ? 'caractères extraits' : 'chars extracted'}</div>}
        </div>
      )}

      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      <div className="flex gap-2">
        <Button variant="primary" onClick={submit}><i className="ti ti-plus" />{lang === 'fr' ? 'Ajouter' : 'Add document'}</Button>
        <Button onClick={onCancel}>{lang === 'fr' ? 'Annuler' : 'Cancel'}</Button>
      </div>
    </Card>
  )
}


// ── Doc Preview + Export ──────────────────────────────────────────────────────

function DocPreview({ doc, lang, onClose }) {
  const [exporting, setExporting] = useState(false)
  const [showFull, setShowFull] = useState(false)

  function downloadTxt() {
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.name.replace(/\s+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 1000)
  }

  async function downloadDocx(template) {
    setExporting(true)
    try {
      await exportDocx({
        type: 'cv',
        content: doc.content,
        profile: {},
        template,
        filename: doc.name.replace(/\s+/g, '-'),
      })
    } catch(e) {
      alert(e.message)
    } finally {
      setExporting(false)
    }
  }

  const preview = showFull ? doc.content : doc.content?.slice(0, 1200)
  const isTruncated = !showFull && doc.content?.length > 1200

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {/* Export bar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[11px] text-gray-400 mr-1">
          {lang === 'fr' ? 'Exporter :' : 'Export:'}
        </span>
        <button onClick={downloadTxt}
          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all">
          <i className="ti ti-file-text text-sm" />.txt
        </button>
        <button onClick={() => downloadDocx('canada')} disabled={exporting}
          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all disabled:opacity-50">
          <i className="ti ti-file-word text-sm text-blue-600" />DOCX Canada
        </button>
        <button onClick={() => downloadDocx('emea')} disabled={exporting}
          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all disabled:opacity-50">
          <i className="ti ti-file-word text-sm text-[#534AB7]" />DOCX EMEA
        </button>
        {exporting && <span className="text-[11px] text-gray-400">{lang === 'fr' ? 'Génération…' : 'Generating…'}</span>}
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-[12px] text-gray-600 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
          {preview}
          {isTruncated && <span className="text-gray-400">…</span>}
        </div>
        {doc.content?.length > 1200 && (
          <button onClick={() => setShowFull(!showFull)}
            className="text-[11px] text-[#534AB7] underline mt-2 block">
            {showFull
              ? (lang === 'fr' ? '↑ Réduire' : '↑ Collapse')
              : (lang === 'fr' ? `↓ Voir tout (${doc.content.length.toLocaleString()} car.)` : `↓ Show all (${doc.content.length.toLocaleString()} chars)`)}
          </button>
        )}
      </div>
    </div>
  )
}

export default function DocLibrary({ lang, documents, onAdd, onDelete, onNavigate }) {
  const [showAdd, setShowAdd] = useState(false)
  const [filterTag, setFilterTag] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const allTags = [...new Set(documents.flatMap(d => d.tags || []))]
  const filtered = filterTag ? documents.filter(d => (d.tags || []).includes(filterTag)) : documents

  function handleAdd(doc) {
    onAdd(doc)
    setShowAdd(false)
  }

  return (
    <div>
      <PageHeader
        title={lang === 'fr' ? 'Bibliothèque de documents' : 'Document Library'}
        subtitle={lang === 'fr'
          ? 'CVs et lettres de référence — utilisés pour générer les documents adaptés par offre'
          : 'CVs and reference letters — used to generate tailored documents per job posting'}
      />

      <Alert variant="info" className="mb-5">
        {lang === 'fr'
          ? 'Ajoutez plusieurs versions de votre CV (par langue, par type de poste) et des lettres de référence. L\'IA s\'en servira comme base pour générer des documents ciblés.'
          : 'Add multiple CV versions (by language, by role type) and reference cover letters. The AI will use them as a base to generate targeted documents.'}
      </Alert>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterTag('')}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${!filterTag ? 'bg-[#534AB7] border-[#534AB7] text-white' : 'bg-white border-gray-200 text-gray-500'}`}>
            {lang === 'fr' ? 'Tous' : 'All'} ({documents.length})
          </button>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(tag === filterTag ? '' : tag)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${filterTag === tag ? 'bg-[#534AB7] border-[#534AB7] text-white' : 'bg-white border-gray-200 text-gray-500'}`}>
              {tag}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <i className="ti ti-plus" />{lang === 'fr' ? 'Ajouter' : 'Add'}
        </Button>
      </div>

      {showAdd && <AddDocForm lang={lang} onAdd={handleAdd} onCancel={() => setShowAdd(false)} />}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <i className="ti ti-files text-3xl block mb-3" />
          <p className="text-[13px]">{lang === 'fr' ? 'Aucun document. Ajoutez votre premier CV.' : 'No documents yet. Add your first CV.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <Card key={doc.id} className={expandedId === doc.id ? 'border-[#534AB7]' : ''}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}>
                  <div className="flex items-center gap-2 mb-1">
                    <i className="ti ti-file-text text-[#534AB7] text-sm" />
                    <div className="font-medium text-[13px] truncate">{doc.name}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {(doc.tags || []).map(t => (
                      <span key={t} className="text-[10px] bg-[#EEEDFE] text-[#534AB7] px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {doc.content?.length?.toLocaleString()} {lang === 'fr' ? 'car.' : 'chars'} · {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Button size="sm" variant="danger" onClick={() => onDelete(doc.id)}>
                  <i className="ti ti-trash" />
                </Button>
              </div>
              {expandedId === doc.id && (
                <DocPreview doc={doc} lang={lang} onClose={() => setExpandedId(null)} />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
