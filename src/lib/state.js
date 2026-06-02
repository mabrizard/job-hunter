// Default search profile
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

export function loadState() {
  return {
    apiKey: localStorage.getItem('ph_apikey') || '',
    profile: JSON.parse(localStorage.getItem('ph_profile') || 'null') || DEFAULT_PROFILE,
    // jobs = single source of truth — pipeline + all generated content per job
    jobs: JSON.parse(localStorage.getItem('ph_jobs') || '[]'),
    // selectedJobId = currently active job across all modules
    selectedJobId: localStorage.getItem('ph_selectedjob') || null,
  }
}

export function saveJobs(jobs) {
  localStorage.setItem('ph_jobs', JSON.stringify(jobs))
}

export function saveSelectedJob(id) {
  if (id) localStorage.setItem('ph_selectedjob', id)
  else localStorage.removeItem('ph_selectedjob')
}

export function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// Create a new job entry with all fields
export function createJob(scanData) {
  return {
    id: `job_${Date.now()}`,
    createdAt: new Date().toISOString(),
    // Scanner data
    title: scanData.title,
    company: scanData.company,
    location: scanData.location,
    roleType: scanData.roleType,
    seniority: scanData.seniority,
    compensation: scanData.compensation,
    requiredStack: scanData.requiredStack || [],
    keyResponsibilities: scanData.keyResponsibilities,
    postedDate: scanData.postedDate,
    sourceUrl: scanData.sourceUrl || scanData._url || '',
    _rawText: scanData._rawText || '',
    // Detected contacts
    hiringManager: scanData.hiringManager || null,
    hrContact: scanData.hrContact || null,
    // Pre-qualify
    score: null,
    recommendation: null,
    scoreDimensions: null,
    scoreAnalysis: null,
    scoreFlags: null,
    scoreDate: null,
    // Doc adapter
    coverLetter: null,
    coverLetterTone: null,
    coverLetterDate: null,
    cvTips: null,
    cvTipsDate: null,
    // Outreach
    outreachMessages: [],
    // Pipeline
    status: 'identified',
    contacts: '',
    nextFollowUp: '',
    notes: '',
    lastAction: new Date().toISOString().split('T')[0],
  }
}

export const PIPELINE_COLUMNS = [
  { id: 'identified', label: 'Identified', color: '#534AB7' },
  { id: 'applied',    label: 'Applied',    color: '#0F6E56' },
  { id: 'inprocess',  label: 'In Process', color: '#BA7517' },
  { id: 'offer',      label: 'Offer',      color: '#639922' },
  { id: 'closed',     label: 'Closed',     color: '#888780' },
  { id: 'abandoned',   label: 'Abandoned',  color: '#C4C2BA' },
]
