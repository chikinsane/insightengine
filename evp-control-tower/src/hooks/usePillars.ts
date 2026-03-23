import { useMemo } from 'react'
import { useOrg } from '../context/OrgContext'
import { PILLARS } from '../data/pillars'
import { getSectorPillars } from '../data/sectorPillars'
import type { Pillar } from '../types'

export function usePillars(): Pillar[] {
  const org = useOrg()

  return useMemo(() => {
    const { pillar9, pillar10 } = getSectorPillars(org.industry)
    return PILLARS.map(p => {
      if (p.id === 9) return { ...p, ...pillar9 }
      if (p.id === 10) return { ...p, ...pillar10 }
      return p
    })
  }, [org.industry])
}
