import React, { useState, useRef } from 'react'
import { extractTextFromPDF } from '../lib/pdfReader'
import { Card, Button, Alert, PageHeader } from './UI'

export default function CVUpload({ t, lang, cvText, onCVUpdate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef()

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError(lang === 'fr' ? 'Format PDF uniquement.' : 'PDF files only.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const text = await extractTextFromPDF(file)
      if (!text || text.length < 50) throw new Error('Could not extract text from PDF. Try copy-paste instead.')
      onCVUpdate(text)
      setFileName(file.name)
    } catch(e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handlePaste(e) {
    const text = e.target.value
    onCVUpdate(text)
  }

  const [tab, setTab] = useState('upload')

  return (
    <div>
      <PageHeader
        title={lang === 'fr' ? 'Mon CV' : 'My CV'}
        subtitle={lang === 'fr' ? 'Uploadez ou collez votre CV — injecté comme contexte RAG dans tous les modules' : 'Upload or paste your CV — injected as RAG context in all AI modules'}
      />

      {cvText && (
        <Alert variant="success" className="mb-4">
          <div>
            <div className="font-medium">{lang === 'fr' ? 'CV chargé ✓' : 'CV loaded ✓'}</div>
            <div className="text-[11px] mt-0.5">
              {fileName && `${fileName} · `}
              {cvText.length.toLocaleString()} {lang === 'fr' ? 'caractères · utilisé dans Scanner, Pre-Qualify, Doc Adapter' : 'characters · used in Scanner, Pre-Qualify, Doc Adapter'}
            </div>
          </div>
        </Alert>
      )}

      <div className="flex border-b border-gray-100 mb-4">
        {['upload', 'paste'].map(tabId => (
          <button key={tabId} onClick={() => setTab(tabId)}
            className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition-colors ${
              tab === tabId ? 'border-[#534AB7] text-[#534AB7] font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>
            {tabId === 'upload'
              ? (lang === 'fr' ? 'Upload PDF' : 'Upload PDF')
              : (lang === 'fr' ? 'Coller le texte' : 'Paste text')}
          </button>
        ))}
      </div>

      <Card className="mb-4">
        {tab === 'upload' ? (
          <div>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#534AB7] hover:bg-[#EEEDFE]/20 transition-all"
            >
              <i className="ti ti-file-type-pdf text-3xl text-gray-300 block mb-2" />
              <div className="text-[13px] text-gray-500 mb-1">
                {lang === 'fr' ? 'Cliquez pour sélectionner votre CV (PDF)' : 'Click to select your CV (PDF)'}
              </div>
              <div className="text-[11px] text-gray-400">
                {lang === 'fr' ? 'Le texte est extrait localement — jamais envoyé à un serveur tiers' : 'Text is extracted locally — never sent to a third-party server'}
              </div>
              <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} className="hidden" />
            </div>
            {loading && (
              <div className="flex items-center gap-2 mt-3 text-[13px] text-gray-500">
                <span className="spinner" />
                {lang === 'fr' ? 'Extraction en cours…' : 'Extracting text…'}
              </div>
            )}
            {fileName && !loading && (
              <div className="mt-3 text-[12px] text-green-700 font-medium">✓ {fileName}</div>
            )}
          </div>
        ) : (
          <div>
            <div className="text-[12px] text-gray-500 font-medium mb-2">
              {lang === 'fr' ? 'Collez le texte de votre CV' : 'Paste your CV text'}
            </div>
            <textarea
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-[#534AB7] resize-y"
              rows={12}
              defaultValue={cvText || ''}
              onChange={handlePaste}
              placeholder={lang === 'fr' ? 'Collez ici le contenu complet de votre CV…' : 'Paste your full CV content here…'}
            />
          </div>
        )}
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Card>

      {cvText && (
        <Card>
          <div className="flex justify-between items-center mb-3">
            <div className="text-[12px] text-gray-500 font-medium">
              {lang === 'fr' ? 'Aperçu du texte extrait' : 'Extracted text preview'}
            </div>
            <Button size="sm" variant="danger" onClick={() => { onCVUpdate(null); setFileName('') }}>
              <i className="ti ti-trash" />{lang === 'fr' ? 'Supprimer' : 'Remove'}
            </Button>
          </div>
          <div className="text-[12px] text-gray-500 bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">
            {cvText.slice(0, 800)}{cvText.length > 800 ? '…' : ''}
          </div>
        </Card>
      )}
    </div>
  )
}
