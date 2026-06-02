import React, { useState } from 'react'
import { Card, Button, Input, Alert, PageHeader } from './UI'

export default function ApiKeyPage({ apiKey, onSave }) {
  const [key, setKey] = useState(apiKey)
  const [saved, setSaved] = useState(false)

  function save() {
    onSave(key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const isProd = import.meta.env.PROD

  return (
    <div>
      <PageHeader title="API Key" subtitle="Configure your Anthropic API key to enable all AI modules" />

      {isProd ? (
        <Alert variant="success" className="mb-5">
          <div>
            <div className="font-medium mb-0.5">Production mode — server-side key</div>
            <div>The API key is stored in Vercel environment variables and never sent to the client. No configuration needed here.</div>
          </div>
        </Alert>
      ) : (
        <>
          <Alert variant="warning" className="mb-5">
            <div>
              <div className="font-medium mb-0.5">Development mode — client-side key</div>
              <div>
                In dev, the key is stored in localStorage and sent directly to api.anthropic.com from your browser.
                In production on Vercel, set <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> as an environment variable instead.
              </div>
            </div>
          </Alert>

          <Card>
            <div className="mb-4">
              <Input
                label="Anthropic API Key"
                type="password"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="sk-ant-api03-..."
              />
              <div className="text-[11px] text-gray-400 mt-1.5">
                Get your key at{' '}
                <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="underline text-[#534AB7]">
                  console.anthropic.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="primary" onClick={save}>
                <i className="ti ti-check" />Save key
              </Button>
              {saved && <span className="text-[12px] text-green-700 font-medium">✓ Saved</span>}
            </div>

            {apiKey ? (
              <Alert variant="success" className="mt-4">
                API key configured — all 5 AI modules are active.
              </Alert>
            ) : (
              <Alert variant="warning" className="mt-4">
                No API key — AI features disabled. Add your key above.
              </Alert>
            )}
          </Card>
        </>
      )}

      <Card className="mt-4">
        <div className="text-[12px] text-gray-500 font-medium mb-3">Vercel deployment checklist</div>
        <ol className="space-y-2 text-[13px] text-gray-600">
          {[
            'Push this repo to GitHub',
            'Connect repo to Vercel (New Project → Import)',
            'Add ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables',
            'Deploy — the /api/claude serverless function handles all LLM calls',
            'Share the Vercel URL',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="bg-[#EEEDFE] text-[#534AB7] rounded-full w-5 h-5 text-[10px] font-medium flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
