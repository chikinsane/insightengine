import { useState, useEffect } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('evp_theme') === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('evp_theme', dark ? 'dark' : 'light')
  }, [dark])
  return { dark, toggle: () => setDark(d => !d) }
}
