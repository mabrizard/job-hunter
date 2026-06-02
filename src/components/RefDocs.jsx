import React, { useState } from 'react'
import { extractTextFromPDF } from '../lib/pdfReader'
import { Card, Button, Alert, PageHeader } from './UI'

function DocSection({ lang, label, icon, value, onChange, onClear, placeholder }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('paste')

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setError('PDF only'); return }
    setLoading(true); setError('')
    try {
      const text = await extractTextFromPDF(file)
      onChange(text)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Card className="mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <i className={`ti ${icon} text-[#534AB7]`} />
          <div className="text-[13px] font-medium">{label}</div>
        </div>
        {value && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">✓ {lang === 'fr' ? 'Chargé' : 'Loaded'} · {value.length.toLocaleString()} {lang === 'fr' ? 'car.' : 'chars'}</span>
            <Button size="sm" variant="danger" onClick={onClear}><i className="ti ti-trash" /></Button>
          </div>
        )}
      </div>

      <div className="flex border-b border-gray-100 mb-3">
        {['paste', 'upload'].map(tabId => (
          <button key={tabId} onClick={() => setTab(tabId)}
            className={`px-3 py-1.5 text-[12px] border-b-2 -mb-px transition-colors ${
              tab === tabId ? 'border-[#534AB7] text-[#534AB7] font-medium' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {tabId === 'paste' ? (lang === 'fr' ? 'Coller' : 'Paste') : 'PDF'}
          </button>
        ))}
      </div>

      {tab === 'paste' ? (
        <textarea
          className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg bg-white outline-none focus:border-[#534AB7] resize-y"
          rows={6}
          defaultValue={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <div>
          <label className="flex items-center gap-3 border border-dashed border-gray-200 rounded-lg px-4 py-3 cursor-pointer hover:border-[#534AB7] hover:bg-[#EEEDFE]/20 transition-all">
            <i className="ti ti-file-type-pdf text-gray-300 text-xl" />
            <span className="text-[12px] text-gray-500">
              {loading ? (lang === 'fr' ? 'Extraction…' : 'Extracting…') : (lang === 'fr' ? 'Sélectionner un PDF' : 'Select a PDF')}
            </span>
            <input type="file" accept=".pdf" onChange={handleFile} className="hidden" />
          </label>
        </div>
      )}
      {error && <Alert variant="danger" className="mt-2 text-[12px]">{error}</Alert>}
    </Card>
  )
}

export default function RefDocs({ lang, refCV, refCoverLetter, onRefCVUpdate, onRefCLUpdate }) {
  return (
    <div>
      <PageHeader
        title={lang === 'fr' ? 'Documents de référence' : 'Reference Documents'}
        subtitle={lang === 'fr'
          ? 'Injectés comme modèles dans Doc Adapter — la lettre et le CV générés s\'en inspireront'
          : 'Injected as templates in Doc Adapter — generated cover letters and CV tips will draw from these'}
      />

      <Alert variant="info" className="mb-5">
        {lang === 'fr'
          ? 'Ces documents sont utilisés comme exemples de style et de contenu. Plus ils sont représentatifs de votre voix, meilleurs seront les résultats.'
          : 'These documents are used as style and content examples. The closer they are to your voice, the better the AI outputs.'}
      </Alert>

      <DocSection
        lang={lang}
        label={lang === 'fr' ? 'CV de référence' : 'Reference CV'}
        icon="ti-id"
        value={refCV}
        onChange={onRefCVUpdate}
        onClear={() => onRefCVUpdate(null)}
        placeholder={lang === 'fr' ? 'Collez votre CV ici…' : 'Paste your CV here…'}
      />

      <DocSection
        lang={lang}
        label={lang === 'fr' ? 'Lettre de motivation modèle' : 'Cover letter template'}
        icon="ti-file-text"
        value={refCoverLetter}
        onChange={onRefCLUpdate}
        onClear={() => onRefCLUpdate(null)}
        placeholder={lang === 'fr' ? 'Collez une lettre de motivation existante comme modèle de style…' : 'Paste an existing cover letter as a style reference…'}
      />
    </div>
  )
}
