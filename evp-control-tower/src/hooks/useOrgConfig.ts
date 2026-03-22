import { useState } from 'react'
import { DEFAULT_ORG } from '../data/orgConfig'
import type { OrgConfig } from '../types'

export function useOrgConfig() {
  const [org, setOrg] = useState<OrgConfig>(() => {
    const saved = localStorage.getItem('evp_org')
    return saved ? JSON.parse(saved) : DEFAULT_ORG
  })
  const save = (config: OrgConfig) => {
    setOrg(config)
    localStorage.setItem('evp_org', JSON.stringify(config))
  }
  return { org, save }
}
