import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { OrgConfig } from '../types'
import { DEFAULT_ORG } from '../data/orgConfig'

interface LandingProps {
  orgConfig: {
    org: OrgConfig
    save: (c: OrgConfig) => void
  }
}

const inputClass =
  'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white'

export default function Landing({ orgConfig }: LandingProps) {
  const navigate = useNavigate()
  const [name, setName] = useState(orgConfig.org?.name ?? DEFAULT_ORG.name)
  const [country, setCountry] = useState(orgConfig.org?.country ?? DEFAULT_ORG.country)
  const [industry, setIndustry] = useState(orgConfig.org?.industry ?? DEFAULT_ORG.industry)

  function handleEnter() {
    orgConfig.save({ name, country, industry, logoInitials: name.slice(0, 2).toUpperCase() })
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo block */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-full bg-rose-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">{name.slice(0, 2).toUpperCase() || 'EV'}</span>
          </div>
          <div>
            <p className="text-slate-900 dark:text-white font-bold text-lg leading-tight">{name || 'Your Organisation'}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">EVP Control Tower</p>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-slate-600 dark:text-slate-300 text-center my-6 text-sm leading-relaxed">
          Understand how the world sees you as an employer
        </p>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
              Organisation Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputClass}
              placeholder="Organisation Name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
              Country
            </label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className={inputClass}
            >
              <option>India</option>
              <option>UAE</option>
              <option>UK</option>
              <option>USA</option>
              <option>Singapore</option>
              <option>Australia</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
              Industry
            </label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className={inputClass}
            >
              <option>Healthcare</option>
              <option>Healthtech</option>
              <option>Pharma</option>
              <option>FMCG</option>
              <option>Retail</option>
              <option>eCommerce</option>
              <option>BFSI</option>
              <option>Fintech</option>
              <option>IT</option>
              <option>Edtech</option>
              <option>Telecom</option>
              <option>Media</option>
              <option>Automotive</option>
              <option>Diversified Conglomerate</option>
            </select>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleEnter}
          className="mt-6 w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          Enter Control Tower →
        </button>

        {/* Demo badge */}
        <div className="mt-5 flex justify-center">
          <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs px-3 py-1 rounded-full">
            Demo Mode • Synthetic Data
          </span>
        </div>
      </div>
    </div>
  )
}
