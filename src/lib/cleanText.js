/**
 * Strip AI markdown markers from generated text
 * Removes: **bold**, *italic*, ### headers, — em-dash sequences, excessive newlines
 */
export function cleanAIText(text) {
  if (!text) return text
  return text
    // Remove bold **text** and __text__
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italic *text* and _text_ (careful not to hit bullet points)
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    // Remove markdown headers ###, ##, #
    .replace(/^#{1,6}\s+/gm, '')
    // Remove leading — or – used as section dividers on their own line
    .replace(/^[\u2014\u2013\-]{2,}\s*$/gm, '')
    // Remove — used as bullet replacement at start of line
    .replace(/^[\u2014\u2013]\s+/gm, '')
    // Clean up triple+ newlines to double
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
