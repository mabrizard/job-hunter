/**
 * Claude API client
 * In production (Vercel): calls /api/claude serverless proxy (key never exposed to browser)
 * In dev: calls api.anthropic.com directly with key from localStorage (for local testing only)
 */

const IS_PROD = import.meta.env.PROD

export async function callClaude(systemPrompt, userMessage, maxTokens = 1000) {
  const payload = {
    model: 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  }

  let response

  if (IS_PROD) {
    // Production: key is stored in Vercel env, not exposed to client
    response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } else {
    // Dev: direct call with key from localStorage
    const apiKey = localStorage.getItem('ph_apikey')
    if (!apiKey) throw new Error('No API key configured. Go to Settings → API Key.')
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(payload),
    })
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${response.status}`)
  }

  const data = await response.json()
  return data.content.map((b) => b.text || '').join('')
}

export function parseJSON(raw) {
  let clean = raw.replace(/```json\n?|```\n?/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch (e) {
    const lastBrace = clean.lastIndexOf('}')
    const lastBracket = clean.lastIndexOf(']')
    const cutPoint = Math.max(lastBrace, lastBracket)
    if (cutPoint > 0) {
      try {
        return JSON.parse(clean.slice(0, cutPoint + 1))
      } catch {}
    }
    throw new Error('Could not parse AI response as JSON — try again')
  }
}
