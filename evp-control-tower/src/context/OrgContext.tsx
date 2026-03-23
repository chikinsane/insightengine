import { createContext, useContext } from 'react'
import type { OrgConfig } from '../types'
import { DEFAULT_ORG } from '../data/orgConfig'

export const OrgContext = createContext<OrgConfig>(DEFAULT_ORG)

export function useOrg() {
  return useContext(OrgContext)
}
