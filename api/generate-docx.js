/**
 * Vercel serverless function: /api/generate-docx
 * Generates DOCX documents (cover letter or CV) server-side
 * Template: 'emea' (colored header) or 'canada' (ATS-friendly, clean)
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType,
  HeadingLevel, ExternalHyperlink, UnderlineType
} = require('docx')

// ── Color palette ──────────────────────────────────────────────────────────
const PURPLE = '534AB7'
const AMBER  = 'EF9F27'
const WHITE  = 'FFFFFF'
const DARK   = '1A1A1A'
const GRAY   = '666666'
const LGRAY  = 'F1EFE8'
const BORDER_GRAY = 'CCCCCC'

// ── Helpers ────────────────────────────────────────────────────────────────

function hr(color = BORDER_GRAY) {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 1 } },
    spacing: { before: 60, after: 60 },
    children: []
  })
}

function spacer(before = 120, after = 0) {
  return new Paragraph({ spacing: { before, after }, children: [] })
}

function txt(text, opts = {}) {
  return new TextRun({
    text,
    font: 'Arial',
    size: opts.size || 22,
    bold: opts.bold || false,
    italics: opts.italics || false,
    color: opts.color || DARK,
    break: opts.break || undefined,
  })
}

function para(children, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.before || 0, after: opts.after || 100 },
    children: Array.isArray(children) ? children : [children],
  })
}

// ── EMEA header (purple background block) ─────────────────────────────────

function emeaHeader(profile) {
  const contactLine = [profile.phone, profile.email, profile.linkedin]
    .filter(Boolean).join('  |  ')

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: PURPLE, type: ShadingType.CLEAR },
            margins: { top: 280, bottom: 280, left: 360, right: 360 },
            width: { size: 9360, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }
            },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [txt(profile.name || '', { size: 36, bold: true, color: WHITE })]
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [txt(contactLine, { size: 18, color: 'EEEDFE' })]
              }),
            ]
          })
        ]
      })
    ]
  })
}

// ── Canada header (clean, ATS-friendly) ───────────────────────────────────

function canadaHeader(profile) {
  const contactLine = [profile.phone, profile.email, profile.linkedin]
    .filter(Boolean).join('  |  ')
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [txt(profile.name || '', { size: 36, bold: true, color: DARK })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [txt(contactLine, { size: 19, color: GRAY })]
    }),
    hr(PURPLE),
  ]
}

// ── Cover letter body ──────────────────────────────────────────────────────

function buildCoverLetter(profile, content, template) {
  const paragraphs = content
    .split('\n')
    .filter(l => l.trim())
    .map(line => para([txt(line, { size: 22, color: DARK })], { before: 0, after: 180 }))

  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const children = []

  if (template === 'emea') {
    children.push(emeaHeader(profile))
    children.push(spacer(240))
  } else {
    canadaHeader(profile).forEach(h => children.push(h))
    children.push(spacer(120))
  }

  children.push(para([txt(date, { size: 20, color: GRAY, italics: true })], { after: 240 }))
  paragraphs.forEach(p => children.push(p))
  children.push(spacer(240))
  children.push(para([txt(profile.name || '', { size: 22, bold: true })]))

  return children
}

// ── CV builder ────────────────────────────────────────────────────────────

function parseCV(content) {
  // Split text into sections by double newlines or section patterns
  const sections = []
  let current = { type: 'body', lines: [] }

  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) {
      if (current.lines.length) {
        sections.push({ ...current })
        current = { type: 'body', lines: [] }
      }
      return
    }
    // Detect section headers (ALL CAPS or ending with :)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 40) {
      if (current.lines.length) sections.push({ ...current })
      current = { type: 'section', lines: [trimmed] }
    } else if (trimmed.startsWith('→') || trimmed.startsWith('•') || trimmed.startsWith('-')) {
      current.type = 'bullet'
      current.lines.push(trimmed.replace(/^[→•\-]\s*/, ''))
    } else {
      current.lines.push(trimmed)
    }
  })
  if (current.lines.length) sections.push(current)
  return sections
}

function buildCV(profile, content, template) {
  const children = []
  const isEmea = template === 'emea'

  if (isEmea) {
    children.push(emeaHeader(profile))
    children.push(spacer(200))
  } else {
    canadaHeader(profile).forEach(h => children.push(h))
    children.push(spacer(100))
  }

  const sections = parseCV(content)

  sections.forEach(section => {
    if (section.type === 'section') {
      children.push(spacer(160))
      children.push(new Paragraph({
        spacing: { before: 0, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: isEmea ? PURPLE : AMBER, space: 1 } },
        children: [txt(section.lines[0], { size: 22, bold: true, color: isEmea ? PURPLE : DARK })]
      }))
      children.push(spacer(60))
    } else if (section.type === 'bullet') {
      section.lines.forEach(line => {
        children.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          spacing: { before: 0, after: 80 },
          children: [txt(line, { size: 20, color: DARK })]
        }))
      })
    } else {
      section.lines.forEach((line, i) => {
        const isBold = i === 0 && section.lines.length > 1
        children.push(para(
          [txt(line, { size: 20, bold: isBold, color: isBold ? DARK : GRAY })],
          { after: 60 }
        ))
      })
    }
  })

  return children
}

// ── Main handler ───────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, content, profile, template = 'canada', filename = 'document' } = req.body

  if (!content) return res.status(400).json({ error: 'content required' })

  try {
    const children = type === 'cv'
      ? buildCV(profile || {}, content, template)
      : buildCoverLetter(profile || {}, content, template)

    const doc = new Document({
      numbering: {
        config: [{
          reference: 'bullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '→',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 480, hanging: 240 } },
                     run: { font: 'Arial', size: 20, color: PURPLE } }
          }]
        }]
      },
      styles: {
        default: { document: { run: { font: 'Arial', size: 22 } } }
      },
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 }
          }
        },
        children
      }]
    })

    const buffer = await Packer.toBuffer(doc)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`)
    res.status(200).send(buffer)

  } catch (err) {
    console.error('DOCX generation error:', err)
    res.status(500).json({ error: err.message })
  }
}
