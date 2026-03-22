import { useEffect } from 'react'
import { CheckCircle, Info, X } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'info'
  visible: boolean
  onClose: () => void
}

export default function Toast({ message, type = 'success', visible, onClose }: ToastProps) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [visible, onClose])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl px-5 py-3 shadow-xl transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {type === 'success'
        ? <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
        : <Info size={18} className="text-sky-400 flex-shrink-0" />
      }
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-1 text-slate-400 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  )
}
