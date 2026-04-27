import { useState } from 'react'
import api from '../api/client.js'

const STATUS_CONFIG = {
  success: { color: 'bg-emerald-400', label: 'Live' },
  error: { color: 'bg-red-400', label: 'Error' },
  running: { color: 'bg-yellow-400 animate-pulse', label: 'Updating' },
  never_run: { color: 'bg-gray-500', label: 'Not run' },
}

export default function Navbar({ pipelineStatus, setPipelineStatus }) {
  const [triggering, setTriggering] = useState(false)

  const handleRefresh = async () => {
    setTriggering(true)
    try {
      await api.post('/api/pipeline/run')
      // Poll status after a short wait
      setTimeout(async () => {
        const res = await api.get('/api/pipeline/status')
        setPipelineStatus(res.data)
        setTriggering(false)
      }, 4000)
    } catch {
      setTriggering(false)
    }
  }

  const cfg = STATUS_CONFIG[pipelineStatus?.status] ?? STATUS_CONFIG.never_run
  const lastRun = pipelineStatus?.last_run
    ? new Date(pipelineStatus.last_run).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <header className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Stock Market Dashboard
          </h1>
          <p className="text-xs text-gray-500">NSE India · XGBoost Forecasting</p>
        </div>

        <div className="flex items-center gap-4">
          {pipelineStatus && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
              <span className="font-medium text-gray-300">{cfg.label}</span>
              {lastRun && <span className="text-gray-600">· {lastRun}</span>}
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={triggering}
            className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-colors"
          >
            {triggering ? (
              <>
                <span className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              'Refresh Data'
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
