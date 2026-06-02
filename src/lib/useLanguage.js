import { useState, useCallback } from 'react'
import { t as translate } from './i18n'

const STORAGE_KEY = 'ph_lang'

export function useLanguage() {
  const [lang, setLangState] = useState(() =>
    localStorage.getItem(STORAGE_KEY) || 'en'
  )

  const setLang = useCallback((l) => {
    localStorage.setItem(STORAGE_KEY, l)
    setLangState(l)
  }, [])

  const t = useCallback((key, ...args) => translate(key, lang, ...args), [lang])

  return { lang, setLang, t }
}
