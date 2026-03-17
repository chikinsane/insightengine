import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

const BrainCanvas = dynamic(() => import('@/components/BrainCanvas'), { ssr: false })

const EXAMPLE_QUERIES = [
  'Show revenue trend by month',
  'Top 10 customers by spend',
  'Compare Q3 vs Q4 sales',
  'Which region grew fastest?',
]

const STATS = [
  { label: 'Data Sources', value: '0' },
  { label: 'Queries Run', value: '0' },
  { label: 'Dashboards', value: '0' },
]

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-[#07070f] text-white overflow-hidden">

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight text-white/90">InsightEngine</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/40">
          <button className="hover:text-white/80 transition-colors">Dashboards</button>
          <button className="hover:text-white/80 transition-colors">Sources</button>
          <button className="hover:text-white/80 transition-colors">History</button>
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 border border-white/[0.08] hover:border-violet-500/40 hover:text-violet-300 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Connect data
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/30 flex items-center justify-center text-xs font-medium text-violet-300">
            {userId.slice(-2).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="relative flex items-center min-h-[calc(100vh-65px)]">

        {/* Ambient background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-violet-700/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-700/10 rounded-full blur-[80px]" />
        </div>

        {/* ── Left: content ── */}
        <div className="relative z-10 flex-1 px-8 sm:px-12 lg:px-20 py-12">
          <div className="max-w-[520px]">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Gen AI · Data Intelligence
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-4">
              Ask anything
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                about your data
              </span>
            </h1>

            <p className="text-white/40 text-base leading-relaxed mb-8">
              Upload a spreadsheet or connect a database. Type a question in plain English — get instant charts, trends, and AI-powered insights.
            </p>

            {/* Query input */}
            <div className="relative group mb-4">
              <div className="absolute -inset-px bg-gradient-to-r from-violet-600/50 to-indigo-600/50 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300" />
              <div className="relative flex items-center bg-[#0f0f1a] border border-white/[0.08] group-focus-within:border-violet-500/40 rounded-2xl px-4 py-3.5 gap-3 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="What were my top 5 products last quarter?"
                  className="flex-1 bg-transparent text-white/90 placeholder-white/20 text-sm outline-none"
                />
                <button className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-violet-900/30">
                  Ask AI
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Example queries */}
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map(q => (
                <button
                  key={q}
                  className="px-3 py-1.5 text-xs text-white/30 border border-white/[0.07] rounded-full hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-10 pt-8 border-t border-white/[0.06]">
              {STATS.map(s => (
                <div key={s.label}>
                  <div className="text-2xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                    {s.value}
                  </div>
                  <div className="text-xs text-white/25 mt-0.5 tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Right: 3D Brain ── */}
        <div className="absolute right-0 top-0 bottom-0 w-[52%] pointer-events-none select-none">
          <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#07070f] to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#07070f] to-transparent z-10" />
          <BrainCanvas />
        </div>

      </main>
    </div>
  )
}
