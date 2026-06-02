export const translations = {
  // App shell
  appName:        { fr: 'Job Hunter',              en: 'Job Hunter' },
  appSubtitle:    { fr: 'Recherche d\'emploi IA',  en: 'AI-native job search' },
  sectionWorkflow:{ fr: 'Workflow',                en: 'Workflow' },
  sectionSettings:{ fr: 'Paramètres',              en: 'Settings' },
  activeJob:      { fr: 'Offre active',            en: 'Active job' },

  // Nav
  navScanner:     { fr: 'Scanner d\'offres',       en: 'Job Scanner' },
  navQualify:     { fr: 'Pré-qualification',       en: 'Pre-Qualify' },
  navPipeline:    { fr: 'Pipeline',                en: 'Pipeline' },
  navAdapter:     { fr: 'Adaptateur docs',         en: 'Doc Adapter' },
  navOutreach:    { fr: 'Messages',                en: 'Outreach' },
  navProfile:     { fr: 'Mon profil',              en: 'My Profile' },
  navApiKey:      { fr: 'Clé API',                 en: 'API Key' },

  // Scanner
  scannerTitle:   { fr: 'Scanner d\'offres',       en: 'Job Scanner' },
  scannerSubtitle:{ fr: 'Collez une description — sauvegarde automatique dans le pipeline', en: 'Paste a job description — auto-saved to pipeline' },
  scannerTabText: { fr: 'Coller le texte',         en: 'Paste text' },
  scannerTabUrl:  { fr: 'URL',                     en: 'URL' },
  scannerLabelText:{ fr: 'Description du poste — copiez/collez depuis LinkedIn, Greenhouse, Lever…', en: 'Job description — copy/paste from LinkedIn, Greenhouse, Lever…' },
  scannerLabelUrl:{ fr: 'URL de l\'offre (pages publiques — Greenhouse, Lever, Workday…)', en: 'Job posting URL (public pages — Greenhouse, Lever, Workday…)' },
  scannerWarningLinkedIn: { fr: 'LinkedIn nécessite une connexion — utilisez "Coller le texte" pour les offres LinkedIn.', en: 'LinkedIn requires login — use Paste text for LinkedIn jobs.' },
  scannerBtn:     { fr: 'Extraire et sauvegarder', en: 'Extract & save to pipeline' },
  scannerScanning:{ fr: 'Analyse en cours…',       en: 'Scanning…' },
  scannerHint:    { fr: 'L\'offre est automatiquement ajoutée au pipeline.', en: 'Job is automatically added to your pipeline and you\'ll be taken to Pre-Qualify.' },
  scannerError:   { fr: 'Saisissez une URL ou collez un texte d\'abord.', en: 'Enter a URL or paste job text first.' },

  // Qualify
  qualifyTitle:   { fr: 'Agent de pré-qualification', en: 'Pre-Qualify Agent' },
  qualifySubtitle:{ fr: 'Score sur 6 dimensions vs votre profil cible', en: 'Score this posting against your target profile — 6 dimensions' },
  qualifyRunBtn:  { fr: 'Lancer la qualification',  en: 'Run qualification' },
  qualifyRerunBtn:{ fr: 'Relancer',                 en: 'Re-run' },
  qualifyScoring: { fr: 'Calcul en cours…',         en: 'Scoring…' },
  qualifyLastScored:{ fr: 'Dernière évaluation :',  en: 'Last scored:' },
  qualifyFitScore:{ fr: 'Score de correspondance',  en: 'Fit Score' },
  qualifyAnalysis:{ fr: 'Analyse',                  en: 'Analysis' },
  qualifyFlags:   { fr: 'Signaux',                  en: 'Flags' },
  qualifyAdaptDocs:{ fr: 'Adapter les documents',   en: 'Adapt docs' },
  qualifyViewPipeline:{ fr: 'Voir le pipeline',     en: 'View pipeline' },
  qualifySalaryFloor:{ fr: 'Plancher salarial :',   en: 'Salary floor:' },
  noJobsYet:      { fr: 'Aucune offre. ',           en: 'No jobs yet. ' },
  scanFirst:      { fr: 'Scannez une offre d\'abord.', en: 'Scan a job first.' },

  // Pipeline
  pipelineTitle:  { fr: 'Pipeline',                 en: 'Pipeline' },
  pipelineSubtitle:{ fr: (t, a, ab) => `${t} total · ${a} actives · ${ab} abandonnées`, en: (t, a, ab) => `${t} total · ${a} active · ${ab} abandoned` },
  pipelineScanNew:{ fr: 'Scanner une offre',        en: 'Scan new job' },
  pipelineEmpty:  { fr: 'Aucune offre. Scannez une offre pour commencer.', en: 'No jobs yet. Scan a posting to get started.' },
  pipelineAbandoned:{ fr: 'Abandonnées',            en: 'Abandoned' },
  pipelineClickExpand:{ fr: 'cliquer pour développer', en: 'click to expand' },
  pipelineScore:  { fr: 'Score',                    en: 'Score' },
  pipelineDocs:   { fr: 'Docs',                     en: 'Docs' },
  pipelineOutreach:{ fr: 'Message',                 en: 'Outreach' },
  pipelineAbandon:{ fr: 'Abandonner',               en: 'Abandon' },
  pipelineRestore:{ fr: 'Restaurer',                en: 'Restore' },
  pipelineConfirmDelete:{ fr: 'Confirmer la suppression', en: 'Confirm delete' },
  pipelineStatus: { fr: 'Statut',                   en: 'Status' },
  pipelineFollowUp:{ fr: 'Prochaine relance',       en: 'Next follow-up' },
  pipelineContacts:{ fr: 'Contacts clés',           en: 'Key contacts' },
  pipelineContactsPlaceholder:{ fr: 'Nom, rôle, LinkedIn…', en: 'Name, role, LinkedIn…' },
  pipelineNotes:  { fr: 'Notes',                    en: 'Notes' },
  pipelineNotesPlaceholder:{ fr: 'Préparation entretien, contexte, prochaines étapes…', en: 'Interview prep, context, next steps…' },
  pipelineSavedDocs:{ fr: 'Documents sauvegardés',  en: 'Saved documents' },
  pipelineCLSaved:{ fr: 'Lettre de motivation ✓',   en: 'Cover Letter ✓' },
  pipelineCVSaved:{ fr: 'Conseils CV ✓',            en: 'CV Tips ✓' },
  pipelineViewEdit:{ fr: 'Voir / modifier',         en: 'View / edit' },
  pipelineQualDetail:{ fr: 'Détail qualification',  en: 'Qualification detail' },

  // Pipeline column labels
  colIdentified:  { fr: 'Identifié',                en: 'Identified' },
  colApplied:     { fr: 'Candidaté',                en: 'Applied' },
  colInProcess:   { fr: 'En cours',                 en: 'In Process' },
  colOffer:       { fr: 'Offre reçue',              en: 'Offer' },
  colClosed:      { fr: 'Clôturé',                  en: 'Closed' },
  colAbandoned:   { fr: 'Abandonné',                en: 'Abandoned' },

  // Adapter
  adapterTitle:   { fr: 'Adaptateur de documents',  en: 'Document Adapter' },
  adapterSubtitle:{ fr: 'Lettres de motivation et conseils CV — sauvegardés par offre', en: 'Cover letters and CV tips — saved per job posting' },
  adapterTabCL:   { fr: 'Lettre de motivation',     en: 'Cover Letter' },
  adapterTabCV:   { fr: 'Conseils CV',              en: 'CV Tips' },
  adapterToneLabel:{ fr: 'Ton et style',            en: 'Tone & style' },
  adapterTone1:   { fr: 'Exécutif — direct et percutant', en: 'Executive — confident & direct' },
  adapterTone2:   { fr: 'Collaboratif — humain et chaleureux', en: 'Collaborative — human & warm' },
  adapterTone3:   { fr: 'Technique — précis et orienté résultats', en: 'Technical — precise & results-focused' },
  adapterGenCL:   { fr: 'Générer la lettre',        en: 'Generate cover letter' },
  adapterRegenCL: { fr: 'Régénérer',                en: 'Regenerate' },
  adapterGenCV:   { fr: 'Générer les conseils CV',  en: 'Generate CV tips' },
  adapterRegenCV: { fr: 'Régénérer',                en: 'Re-analyze' },
  adapterWriting: { fr: 'Rédaction en cours…',      en: 'Writing…' },
  adapterAnalyzing:{ fr: 'Analyse en cours…',       en: 'Analyzing…' },
  adapterSaved:   { fr: '✓ sauvegardé',             en: '✓ saved' },
  adapterEditHint:{ fr: 'Les modifications sont sauvegardées automatiquement.', en: 'Edits are saved automatically when you click away.' },
  adapterCLLabel: { fr: 'Lettre de motivation',     en: 'Cover letter' },
  adapterCVLabel: { fr: 'Conseils CV',              en: 'CV tips' },

  // Outreach
  outreachTitle:  { fr: 'Générateur de messages',   en: 'Outreach Generator' },
  outreachSubtitle:{ fr: 'Messages LinkedIn — 2-3 phrases, ton pair-à-pair, sauvegardés par offre', en: 'LinkedIn messages — 2–3 sentences, peer tone, saved to job' },
  outreachLinkedTo:{ fr: 'Lié à l\'offre',          en: 'Linked to' },
  outreachContactLabel:{ fr: 'Nom et rôle du contact', en: 'Contact name & role' },
  outreachContactPlaceholder:{ fr: 'Sarah Chen — VP Pre-Sales, Datadog', en: 'Sarah Chen — VP Pre-Sales, Datadog' },
  outreachLangLabel:{ fr: 'Langue',                 en: 'Language' },
  outreachContextLabel:{ fr: 'Contexte / raison de la prise de contact', en: 'Context / reason to reach out' },
  outreachContextPlaceholder:{ fr: 'Candidature pour Directeur Pre-Sales. Connexion commune : Jean-Michel Durand.', en: 'Applying to Director Pre-Sales. Common connection: Jean-Michel Durand.' },
  outreachGenBtn: { fr: 'Générer le message',       en: 'Generate message' },
  outreachRegenBtn:{ fr: 'Régénérer',               en: 'Regenerate' },
  outreachWriting:{ fr: 'Rédaction…',               en: 'Writing…' },
  outreachVariants:{ fr: 'Variantes de messages',   en: 'Message variants' },
  outreachPast:   { fr: 'Messages précédents pour cette offre', en: 'Previous outreach for this job' },
  outreachNoJob:  { fr: 'Aucune offre sélectionnée — le message ne sera pas sauvegardé. ', en: 'No job selected — message won\'t be saved. ' },

  // Profile
  profileTitle:   { fr: 'Mon profil de recherche',  en: 'My Search Profile' },
  profileSubtitle:{ fr: 'Injecté comme contexte RAG dans chaque appel IA', en: 'Injected as RAG context into every agent call' },
  profileAlert:   { fr: 'Ce profil est la source de vérité pour tous les modules IA. Plus il est précis, meilleurs sont les résultats.', en: 'This profile is the single source of truth for all AI modules. The more specific, the better the scoring and document generation.' },
  profileName:    { fr: 'Votre nom',                en: 'Your name' },
  profileRoles:   { fr: 'Postes cibles (séparés par des virgules)', en: 'Target roles (comma-separated)' },
  profileSalary:  { fr: 'Plancher salarial (TC)',    en: 'Salary floor (TC)' },
  profileCurrency:{ fr: 'Devise',                   en: 'Currency' },
  profileGeos:    { fr: 'Géographies prioritaires', en: 'Priority geographies' },
  profileStrengths:{ fr: 'Forces différenciantes',  en: 'Key differentiating strengths' },
  profileDealbreakers:{ fr: 'Éliminatoires',        en: 'Dealbreakers' },
  profileCVSummary:{ fr: 'Résumé CV (injecté comme contexte)', en: 'CV summary (injected as context)' },
  profileSaveBtn: { fr: 'Sauvegarder',              en: 'Save profile' },
  profileSaved:   { fr: '✓ Sauvegardé',             en: '✓ Saved' },

  // API Key
  apiKeyTitle:    { fr: 'Clé API',                  en: 'API Key' },
  apiKeySubtitle: { fr: 'Configurez votre clé API Anthropic', en: 'Configure your Anthropic API key to enable all AI modules' },

  // Common
  copy:           { fr: 'Copier',                   en: 'Copy' },
  copied:         { fr: 'Copié !',                  en: 'Copied!' },
  noJobSelected:  { fr: 'Aucune offre sélectionnée.', en: 'No job selected.' },
  hiringManager:  { fr: 'Resp. recrutement',        en: 'Hiring Manager' },
  hrContact:      { fr: 'Contact RH',               en: 'HR' },
  outreachArrow:  { fr: 'message →',                en: 'outreach →' },
  liveRate:       { fr: 'live',                     en: 'live' },
  estRate:        { fr: 'est.',                     en: 'est.' },
  language:       { fr: 'Langue',                   en: 'Language' },
}

export function t(key, lang, ...args) {
  const entry = translations[key]
  if (!entry) return key
  const val = entry[lang] || entry['en'] || key
  if (typeof val === 'function') return val(...args)
  return val
}
