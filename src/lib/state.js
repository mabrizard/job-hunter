export const DEFAULT_JUNIOR_PROFILE = {
  mode: 'junior',
  name: '',
  phone: '',
  email: '',
  linkedin: '',
  // Junior specific
  studyLevel: '', // Bac+2, Bac+3, Bac+5, Autodidacte...
  studyDomain: '', // Informatique, Commerce, Marketing...
  contractTypes: '', // Stage, Alternance, CDI Junior, CDD
  sectors: '', // Tech, SaaS, Conseil, Finance...
  geos: '',
  technicalSkills: '', // Langages, outils, certifs
  extraExperience: '', // Stages, projets perso, bénévolat, associations
  strengths: '', // Ce qui me différencie
  cvSummary: '', // Résumé libre
}

// Default search profile
export const DEFAULT_PROFILE = {
  name: 'Marc-Alexandre',
  targetRoles: 'Manager / Director Pre-Sales, Solutions Consulting Manager, Forward Deployed Manager',
  salaryFloor: '160000',
  salaryCurrency: 'EUR',
  geos: 'Québec, Alberta, Toronto, Ottawa, Montréal, Calgary (priority). EMEA / France (fallback). UK excluded.',
  strengths: 'Player/coach leadership, MEDDPICC, C-level relationships, regulated sectors (finance, healthcare, public sector), bilingual FR/EN, AI-native',
  dealbreakers: 'UK-only roles, pure IC non-management, below salary floor, unrelated domain (HR tech, pure e-commerce), no management scope',
  phone: '',
  email: '',
  linkedin: '',
  mode: 'senior',
  phone: '',
  email: '',
  linkedin: '',
  // Enriched profile
  experiences: [],        // [{id, employer, role, period, description, metrics, tags[]}]
  keyMetrics: [],         // [{id, label, value}] — user-defined, any profession
  repositioningAngles: [],// [{id, label, description}] — how I pitch myself per role type
  immigration: {
    residenceCountry: 'France',
    workAuthorized: true,
    needsSponsorshipCurrently: false,
    targetCountries: '',
    needsSponsorshipTarget: '',
    processUnderway: '',
    availabilityTimeline: '',
    howToPresent: 'proactive', // 'proactive' | 'on_request' | 'interview_only'
  },
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
    // Uploaded CV text — injected as RAG context
    cvText: localStorage.getItem('ph_cvtext') || null,
    // Reference documents
    refCV: localStorage.getItem('ph_refcv') || null,
    refCoverLetter: localStorage.getItem('ph_refcl') || null,
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
    // ATS & probability
    atsScore: null,
    atsKeywords: null,
    atsDate: null,
    probabilityScore: null,
    probabilityFactors: null,
    probabilityDate: null,
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
