/**
 * FX rate fetching — EUR/CAD, USD/CAD, GBP/CAD
 * Uses exchangerate-api.com open endpoint (no key required, ~1500 req/month free)
 * Falls back to hardcoded rates if fetch fails
 */

const FALLBACK_RATES = {
  EUR: 1.48,
  USD: 1.36,
  GBP: 1.72,
  CAD: 1.00,
}

let cachedRates = null
let cacheTime = null
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

export async function getCADRates() {
  if (cachedRates && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
    return { rates: cachedRates, live: true, cached: true }
  }
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/CAD')
    if (!res.ok) throw new Error('fetch failed')
    const data = await res.json()
    // data.rates are X per 1 CAD — we want CAD per 1 X, so invert
    const rates = {}
    for (const [currency, rate] of Object.entries(data.rates)) {
      rates[currency] = 1 / rate
    }
    cachedRates = rates
    cacheTime = Date.now()
    return { rates, live: true, cached: false, updatedAt: data.time_last_update_utc }
  } catch {
    return { rates: FALLBACK_RATES, live: false, cached: false }
  }
}

export async function convertToCAD(amount, currency) {
  const { rates, live } = await getCADRates()
  const rate = rates[currency] || rates['USD'] || 1.36
  return { cad: Math.round(amount * rate), rate, live }
}

export function formatCAD(amount) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount)
}
