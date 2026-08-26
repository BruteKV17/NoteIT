/**
 * Teacher UID Code system — the "KISHVERM" scheme.
 *
 * 8-character uppercase code = first 4 letters of the first name
 * + first 4 letters of the surname.
 *   "Kishan Verma"  ->  "KISH" + "VERM"  ->  "KISHVERM"
 *
 * Short names are padded with X so the code is always exactly 8 chars.
 */

/** Strip accents/diacritics and keep only A–Z. */
function lettersOnly(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // drop combining marks
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
}

/** Take the first 4 letters of a single name part, padding with X. */
function part4(value: string): string {
  return lettersOnly(value).slice(0, 4).padEnd(4, 'X')
}

/**
 * Generate the 8-character Teacher UID Code.
 * Returns "" only when both names are empty (so the preview can stay blank).
 */
export function generateTeacherCode(firstName: string, surname: string): string {
  const first = lettersOnly(firstName)
  const last = lettersOnly(surname)
  if (!first && !last) return ''
  return part4(firstName) + part4(surname)
}

/**
 * Live preview for the setup modal — always returns 8 slots so the UI can
 * render placeholder boxes even before typing.
 */
export function previewTeacherCode(firstName: string, surname: string): string {
  return (part4(firstName) + part4(surname)).slice(0, 8)
}

/** Convert a phone string to the digits-only form wa.me expects. */
export function toWaNumber(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

/** Build a WhatsApp deep link with an optional prefilled message. */
export function buildWaLink(phone: string, message?: string): string {
  const num = toWaNumber(phone)
  const base = `https://wa.me/${num}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/** Two-letter initials for avatars. */
export function initialsFrom(firstName: string, surname: string): string {
  const a = lettersOnly(firstName).charAt(0) || ''
  const b = lettersOnly(surname).charAt(0) || ''
  return (a + b || 'NT').slice(0, 2)
}
