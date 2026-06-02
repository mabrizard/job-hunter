// Default search profile — pre-filled with Marc-Alexandre's parameters
export const DEFAULT_PROFILE = {
  name: 'Marc-Alexandre',
  targetRoles: 'Manager / Director Pre-Sales, Solutions Consulting Manager, Forward Deployed Manager',
  salaryFloor: '160000',
  salaryCurrency: 'EUR',
  geos: 'Québec, Alberta, Toronto, Ottawa, Montréal, Calgary (priority). EMEA / France (fallback). UK excluded.',
  strengths: 'Player/coach leadership, MEDDPICC, C-level relationships, regulated sectors (finance, healthcare, public sector), bilingual FR/EN, AI-native',
  dealbreakers: 'UK-only roles, pure IC non-management, below salary floor, unrelated domain (HR tech, pure e-commerce), no management scope',
  cvSummary: `Senior pre-sales leader with 10+ years in enterprise SaaS. Led teams of 5–12 SCs across EMEA and North America. Deep expertise in regulated industries (finance, healthcare, public sector). Fluent French/English. Consistent track record closing €5M+ deals with MEDDPICC. Player/coach: still demo, still technical, while building and coaching the team. AI-native: uses LLMs in daily workflow.`,
}

// Load from localStorage or fall back to defaults
export function loadState() {
  return {
    apiKey: localStorage.getItem('ph_apikey') || '',
    profile: JSON.parse(localStorage.getItem('ph_profile') || 'null') || DEFAULT_PROFILE,
    pipeline: JSON.parse(localStorage.getItem('ph_pipeline') || '[]'),
    currentJob: JSON.parse(localStorage.getItem('ph_currentjob') || 'null'),
    currentScore: JSON.parse(localStorage.getItem('ph_currentscore') || 'null'),
  }
}

export function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function clearJob() {
  localStorage.removeItem('ph_currentjob')
  localStorage.removeItem('ph_currentscore')
}

export const PIPELINE_COLUMNS = [
  { id: 'identified', label: 'Identified', color: '#534AB7' },
  { id: 'applied',    label: 'Applied',    color: '#0F6E56' },
  { id: 'inprocess',  label: 'In Process', color: '#BA7517' },
  { id: 'offer',      label: 'Offer',      color: '#639922' },
  { id: 'closed',     label: 'Closed',     color: '#888780' },
]
