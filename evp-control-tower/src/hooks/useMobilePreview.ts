import { useState, useEffect } from 'react'

export function useMobilePreview() {
  const [mobile, setMobile] = useState(() => localStorage.getItem('evp_mobile') === 'true')
  useEffect(() => {
    localStorage.setItem('evp_mobile', String(mobile))
  }, [mobile])
  return { mobile, toggle: () => setMobile(m => !m) }
}
