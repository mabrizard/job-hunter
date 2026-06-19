import React, { useState } from 'react'
import { callClaude, parseJSON } from '../lib/api'
import { cleanAIText } from '../lib/cleanText'
import { Card, Button, Alert, Tag, PageHeader, Spinner, JobSwitcher } from './UI'

function buildATSSystem(cvText, refContent) {
  return `You are an ATS expert and honest career advisor for senior pre-sales leaders.
${cvText ? `CANDIDATE CV:\n${cvText.slice(0, 3000)}\n` : ''}
${refContent ? `REFERENCE DOCUMENT:\n${refContent.slice(0, 2000)}\n` : ''}

Analyze the job vs CV and return ONLY valid JSON:
{
  "atsScore": number (0-100),
  "probabilityScore": number (0-100),
  "keywordsFound": string[],
  "keywordsMissing": string[],
  "atsAnalysis": string,
  "probabilityAnalysis": string,
  "recommendations": [
    {
      "action": string (specific thing to do),
      "category": "do" | "adapt" | "ignore",
      "reason": string (why — for 'ignore', explain the interview risk)
    }
  ],
  "quickWins": string[]
}
Categories:
- "do": candidate genuinely has this experience, safe to add/strengthen
- "adapt": candidate has adjacent experience — reframe honestly without inventing
- "ignore": keyword stuffing risk — candidate doesn't have real experience, would fail in interview`
}

function buildConversationSystem(cvText, job, previousAnalysis) {
  return `You are an honest career advisor helping a senior pre-sales leader refine their CV adaptation.

JOB: ${job.title} at ${job.company}
PREVIOUS ANALYSIS: ${JSON.stringify(previousAnalysis)}
${cvText ? `CV: ${cvText.slice(0, 2000)}` : ''}

The candidate is responding to specific recommendations. Listen carefully to their feedback.
If they say they DO have certain experience → upgrade "adapt" to "do", make the recommendation more specific.
If they say they DON'T have experience → confirm "ignore" and suggest a genuine alternative.
If they clarify context → revise the recommendation accordingly.

Respond conversationally (2-3 sentences acknowledging their input), then provide:
REVISED RECOMMENDATIONS: updated list based on their feedback
FORMAT: plain text, no markdown, no bullet symbols`
}

const CAT_STYLE = {
  do:     { label: '✓ À faire',   bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100 text-green-700' },
  adapt:  { label: '⚡ Adapter',  bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700' },
  ignore: { label: '✗ Ignorer',  bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-800',   badge: 'bg-red-100 text-red-700' },
}

function ScoreRing({ score, label, color }) {
  const r = 28, circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#F1EFE8" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[18px] font-medium" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="text-[11px] text-gray-500 mt-1 text-center">{label}</div>
    </div>
  )
}

export default function ATSScore({ t, lang, selectedJob, jobs, cvText, documents, onUpdateJob, onSelectJob, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedDocId, setSelectedDocId] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const hasResults = selectedJob?.atsScore != null
  const data = selectedJob?.atsKeywords
  const chatHistory = selectedJob?.atsChatHistory || []
  const selectedDoc = documents?.find(d => d.id === selectedDocId)

  async function runAnalysis() {
    if (!selectedJob) return
    setLoading(true); setError('')
    try {
      const sys = buildATSSystem(cvText, selectedDoc?.content)
      const userMsg = `Analyze: ${selectedJob.title} at ${selectedJob.company} (${selectedJob.location})
Role type: ${selectedJob.roleType} | Seniority: ${selectedJob.seniority}
Required: ${(selectedJob.requiredStack||[]).join(', ')}
Responsibilities: ${selectedJob.keyResponsibilities}
Compensation: ${selectedJob.compensation || 'Not specified'}
Posted: ${selectedJob.postedDate || 'Unknown'}`
      const raw = await callClaude(sys, userMsg, 2500)
      const result = parseJSON(raw)
      onUpdateJob(selectedJob.id, {
        atsScore: result.atsScore,
        atsKeywords: result,
        atsDate: new Date().toISOString(),
        probabilityScore: result.probabilityScore,
        atsChatHistory: [],
      })
      setShowChat(false)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function sendChat() {
    if (!chatInput.trim() || !selectedJob) return
    setChatLoading(true)
    const userMessage = chatInput.trim()
    setChatInput('')
    try {
      const sys = buildConversationSystem(cvText, selectedJob, data)
      const history = chatHistory.map(m => `${m.role === 'user' ? 'Candidate' : 'Advisor'}: ${m.content}`).join('\n')
      const userMsg = `${history}\nCandidate: ${userMessage}`
      const raw = await callClaude(sys, userMsg, 800)
      const response = cleanAIText(raw)
      const newHistory = [
        ...chatHistory,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response },
      ]
      onUpdateJob(selectedJob.id, { atsChatHistory: newHistory.slice(-8) })
    } catch(e) { setError(e.message) }
    finally { setChatLoading(false) }
  }

  return (
    <div>
      <PageHeader
        title={lang === 'fr' ? 'ATS & Probabilité' : 'ATS & Probability'}
        subtitle={lang === 'fr' ? 'Score ATS + probabilité de réponse + recommandations honnêtes' : 'ATS score + response probability + honest recommendations'}
      />

      {!cvText && (
        <Alert variant="warning" className="mb-4">
          {lang === 'fr' ? <>Aucun CV chargé — <button onClick={() => onNavigate('cv')} className="underline cursor-pointer">uploadez votre CV</button> pour un score précis.</> : <>No CV loaded — <button onClick={() => onNavigate('cv')} className="underline cursor-pointer">upload your CV</button> for accurate scoring.</>}
        </Alert>
      )}

      {jobs.length === 0 ? (
        <Alert variant="warning">{lang === 'fr' ? 'Aucune offre. ' : 'No jobs yet. '}<button onClick={() => onNavigate('scanner')} className="underline cursor-pointer">{lang === 'fr' ? 'Scannez une offre.' : 'Scan a job first.'}</button></Alert>
      ) : (
        <>
          <JobSwitcher jobs={jobs} selectedId={selectedJob?.id} onSelect={onSelectJob} />

          {selectedJob && (
            <>
              <Card className="mb-4">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div>
                    <div className="font-medium">{selectedJob.title}</div>
                    <div className="text-[12px] text-gray-500">{selectedJob.company} · {selectedJob.location}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag variant="purple">{selectedJob.roleType}</Tag>
                  </div>
                </div>

                {/* Document selector */}
                {documents?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-[12px] text-gray-500 font-medium mb-2">
                      {lang === 'fr' ? 'Document de référence (optionnel)' : 'Reference document (optional)'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => setSelectedDocId('')}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${!selectedDocId ? 'bg-[#534AB7] border-[#534AB7] text-white' : 'bg-white border-gray-200 text-gray-500'}`}>
                        {lang === 'fr' ? 'Aucun' : 'None'}
                      </button>
                      {documents.map(d => (
                        <button key={d.id} onClick={() => setSelectedDocId(d.id === selectedDocId ? '' : d.id)}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${selectedDocId === d.id ? 'bg-[#534AB7] border-[#534AB7] text-white' : 'bg-white border-gray-200 text-gray-500'}`}>
                          {d.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <Button variant="primary" onClick={runAnalysis} disabled={loading}>
                  {loading ? <><Spinner />{lang === 'fr' ? 'Analyse…' : 'Analyzing…'}</> : <><i className="ti ti-scan" />{hasResults ? (lang === 'fr' ? 'Relancer' : 'Re-run') : (lang === 'fr' ? 'Lancer l\'analyse' : 'Run analysis')}</>}
                </Button>
                {hasResults && (
                  <Button size="sm" onClick={() => setShowChat(!showChat)}>
                    <i className="ti ti-message-circle" />
                    {lang === 'fr' ? 'Affiner avec l\'IA' : 'Refine with AI'}
                    {chatHistory.length > 0 && <span className="ml-1 bg-[#534AB7] text-white text-[9px] px-1.5 py-0.5 rounded-full">{chatHistory.filter(m => m.role === 'user').length}</span>}
                  </Button>
                )}
                {error && <span className="text-[12px] text-red-600">{error}</span>}
                {selectedJob.atsDate && <span className="text-[11px] text-gray-400">{lang === 'fr' ? 'Analysé le' : 'Analyzed'}: {new Date(selectedJob.atsDate).toLocaleDateString()}</span>}
              </div>

              {hasResults && data && (
                <div className="space-y-4">
                  {/* Scores */}
                  <Card>
                    <div className="flex justify-around py-2">
                      <ScoreRing score={data.atsScore} label={lang === 'fr' ? 'Score ATS' : 'ATS Score'} color="#534AB7" />
                      <ScoreRing score={data.probabilityScore} label={lang === 'fr' ? 'Prob. réponse' : 'Response prob.'} color={data.probabilityScore >= 60 ? '#639922' : data.probabilityScore >= 35 ? '#BA7517' : '#E24B4A'} />
                    </div>
                  </Card>

                  {/* Keywords */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <div className="text-[12px] text-green-700 font-medium mb-2">✓ {lang === 'fr' ? 'Présents' : 'Found'} ({data.keywordsFound?.length || 0})</div>
                      <div className="flex flex-wrap gap-1.5">{data.keywordsFound?.map(k => <span key={k} className="text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{k}</span>)}</div>
                    </Card>
                    <Card>
                      <div className="text-[12px] text-red-600 font-medium mb-2">✗ {lang === 'fr' ? 'Manquants' : 'Missing'} ({data.keywordsMissing?.length || 0})</div>
                      <div className="flex flex-wrap gap-1.5">{data.keywordsMissing?.map(k => <span key={k} className="text-[11px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">{k}</span>)}</div>
                    </Card>
                  </div>

                  {/* Honest recommendations */}
                  {data.recommendations?.length > 0 && (
                    <Card>
                      <div className="text-[12px] text-gray-500 font-medium mb-3">
                        {lang === 'fr' ? 'Recommandations — filtrées par honnêteté' : 'Recommendations — filtered by honesty'}
                      </div>
                      <div className="space-y-2">
                        {data.recommendations.map((r, i) => {
                          const s = CAT_STYLE[r.category] || CAT_STYLE.adapt
                          return (
                            <div key={i} className={`rounded-lg p-3 border ${s.bg} ${s.border}`}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className={`text-[12px] font-medium ${s.text}`}>{r.action}</div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${s.badge}`}>{s.label}</span>
                              </div>
                              <div className={`text-[11px] ${s.text} opacity-80`}>{r.reason}</div>
                            </div>
                          )
                        })}
                      </div>
                    </Card>
                  )}

                  {/* Analysis */}
                  <Card>
                    <div className="text-[12px] text-gray-500 font-medium mb-2">{lang === 'fr' ? 'Analyse ATS' : 'ATS Analysis'}</div>
                    <p className="text-[13px] text-gray-600 leading-relaxed mb-3">{data.atsAnalysis}</p>
                    <div className="text-[12px] text-gray-500 font-medium mb-2">{lang === 'fr' ? 'Probabilité de réponse' : 'Response probability'}</div>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{data.probabilityAnalysis}</p>
                  </Card>

                  {/* Chat refinement */}
                  {showChat && (
                    <Card>
                      <div className="text-[12px] text-gray-500 font-medium mb-3">
                        {lang === 'fr' ? 'Affiner avec l\'IA — répondez aux recommandations' : 'Refine with AI — respond to recommendations'}
                      </div>

                      {/* Chat history */}
                      {chatHistory.length > 0 && (
                        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                          {chatHistory.map((m, i) => (
                            <div key={i} className={`rounded-lg p-3 text-[12px] leading-relaxed ${m.role === 'user' ? 'bg-[#EEEDFE] text-[#3C3489] ml-4' : 'bg-gray-50 text-gray-600 mr-4'}`}>
                              {m.content}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <textarea
                          className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-[#534AB7] resize-none"
                          rows={3}
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder={lang === 'fr'
                            ? 'Ex: "Je n\'ai jamais vendu F5 mais j\'ai géré des démos sur des architectures zero-trust chez des clients bancaires"'
                            : 'E.g. "I haven\'t sold F5 but I ran zero-trust architecture demos for banking clients"'}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChat())}
                        />
                        <Button variant="primary" onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="self-end">
                          {chatLoading ? <Spinner /> : <i className="ti ti-send" />}
                        </Button>
                      </div>
                      {chatHistory.length >= 8 && (
                        <div className="text-[11px] text-gray-400 mt-2">{lang === 'fr' ? 'Limite de 4 échanges atteinte.' : 'Max 4 exchanges reached.'}</div>
                      )}
                    </Card>
                  )}

                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={() => onNavigate('adapter')}><i className="ti ti-file-text" />{lang === 'fr' ? 'Adapter les docs' : 'Adapt docs'}</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
