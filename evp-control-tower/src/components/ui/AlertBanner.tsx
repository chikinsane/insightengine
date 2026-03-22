import { AlertTriangle, X } from 'lucide-react'

interface AlertBannerProps {
  alerts: string[]
  onDismiss?: () => void
}

export default function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  if (alerts.length === 0) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
            Critical Gaps Identified
          </p>
          <ul className="space-y-1">
            {alerts.map((alert, i) => (
              <li key={i} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                {alert}
              </li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
