/**
 * PDF text extraction — client-side via PDF.js CDN
 * Loaded dynamically to avoid bundle size impact
 */

let pdfjs = null

async function loadPDFJS() {
  if (pdfjs) return pdfjs
  // Load PDF.js from CDN
  await new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  pdfjs = window.pdfjsLib
  return pdfjs
}

export async function extractTextFromPDF(file) {
  const lib = await loadPDFJS()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    fullText += pageText + '\n'
  }
  return fullText.trim()
}
