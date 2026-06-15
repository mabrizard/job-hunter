/**
 * Build enriched RAG context from profile
 * Used by all AI agents — injects experiences, metrics, angles, immigration
 */

export function buildEnrichedContext(profile, options = {}) {
  const lines = []
  const lang = options.lang || 'en'
  const isFr = lang === 'fr'

  // Basic profile
  lines.push(`${isFr ? 'Nom' : 'Name'}: ${profile.name}`)
  if (profile.phone || profile.email || profile.linkedin) {
    lines.push(`${isFr ? 'Contact' : 'Contact'}: ${[profile.phone, profile.email, profile.linkedin].filter(Boolean).join(' | ')}`)
  }

  if (profile.mode === 'senior') {
    lines.push(`${isFr ? 'Postes cibles' : 'Target roles'}: ${profile.targetRoles || ''}`)
    lines.push(`${isFr ? 'Plancher salarial' : 'Salary floor'}: ${profile.salaryFloor} ${profile.salaryCurrency}`)
    lines.push(`${isFr ? 'Géographies prioritaires' : 'Priority geos'}: ${profile.geos || ''}`)
    lines.push(`${isFr ? 'Forces' : 'Strengths'}: ${profile.strengths || ''}`)
    lines.push(`${isFr ? 'Éliminatoires' : 'Dealbreakers'}: ${profile.dealbreakers || ''}`)
    lines.push(`${isFr ? 'Résumé CV' : 'CV summary'}: ${profile.cvSummary || ''}`)
  } else {
    lines.push(`${isFr ? 'Formation' : 'Education'}: ${profile.studyLevel} en ${profile.studyDomain}`)
    lines.push(`${isFr ? 'Compétences' : 'Skills'}: ${profile.technicalSkills || ''}`)
    lines.push(`${isFr ? 'Expériences' : 'Experiences'}: ${profile.extraExperience || ''}`)
    lines.push(`${isFr ? 'Forces' : 'Strengths'}: ${profile.strengths || ''}`)
    lines.push(`${isFr ? 'Contrat recherché' : 'Contract type'}: ${profile.contractTypes || ''}`)
    lines.push(`${isFr ? 'Secteurs' : 'Sectors'}: ${profile.sectors || ''}`)
    lines.push(`${isFr ? 'Zone géo' : 'Geo'}: ${profile.geos || ''}`)
  }

  // Key metrics
  if (profile.keyMetrics?.length > 0) {
    lines.push(`\n${isFr ? 'CHIFFRES CLÉS' : 'KEY METRICS'}:`)
    profile.keyMetrics.forEach(m => {
      if (m.label && m.value) lines.push(`- ${m.label}: ${m.value}`)
    })
  }

  // Experiences
  if (profile.experiences?.length > 0) {
    lines.push(`\n${isFr ? 'EXPÉRIENCES DÉTAILLÉES' : 'DETAILED EXPERIENCES'}:`)
    profile.experiences.forEach(exp => {
      if (!exp.employer) return
      lines.push(`\n${exp.employer}${exp.role ? ` — ${exp.role}` : ''}${exp.period ? ` (${exp.period})` : ''}`)
      if (exp.description) lines.push(exp.description)
      if (exp.metrics) lines.push(`${isFr ? 'Réalisations' : 'Achievements'}: ${exp.metrics}`)
      if (exp.tags?.length) lines.push(`Tags: ${exp.tags.join(', ')}`)
    })
  }

  // Repositioning angles — inject the relevant one if role type matches
  if (profile.repositioningAngles?.length > 0 && options.roleType) {
    const angle = profile.repositioningAngles.find(a =>
      a.label?.toLowerCase().includes(options.roleType.toLowerCase())
    ) || profile.repositioningAngles[0]
    if (angle?.description) {
      lines.push(`\n${isFr ? 'ANGLE DE POSITIONNEMENT POUR CE RÔLE' : 'POSITIONING ANGLE FOR THIS ROLE'}:`)
      lines.push(angle.description)
    }
  } else if (profile.repositioningAngles?.length > 0) {
    lines.push(`\n${isFr ? 'ANGLES DE REPOSITIONNEMENT' : 'REPOSITIONING ANGLES'}:`)
    profile.repositioningAngles.forEach(a => {
      if (a.label && a.description) lines.push(`${a.label}: ${a.description}`)
    })
  }

  // Immigration
  const imm = profile.immigration
  if (imm && (imm.processUnderway || imm.targetCountries || imm.availabilityTimeline)) {
    lines.push(`\n${isFr ? 'MOBILITÉ & IMMIGRATION' : 'MOBILITY & IMMIGRATION'}:`)
    if (imm.residenceCountry) lines.push(`${isFr ? 'Résidence' : 'Residence'}: ${imm.residenceCountry} (${isFr ? 'autorisé à travailler' : 'authorized to work'}: ${imm.workAuthorized ? 'Oui/Yes' : 'Non/No'})`)
    if (imm.targetCountries) lines.push(`${isFr ? 'Cibles' : 'Targets'}: ${imm.targetCountries}`)
    if (imm.needsSponsorshipTarget) lines.push(`${isFr ? 'Sponsorship requis' : 'Sponsorship needed'}: ${imm.needsSponsorshipTarget}`)
    if (imm.processUnderway) lines.push(`${isFr ? 'Processus' : 'Process'}: ${imm.processUnderway}`)
    if (imm.availabilityTimeline) lines.push(`${isFr ? 'Disponibilité' : 'Availability'}: ${imm.availabilityTimeline}`)
    if (imm.howToPresent) lines.push(`${isFr ? 'Comment présenter' : 'How to present'}: ${imm.howToPresent}`)
  }

  return lines.join('\n')
}
