import { useState, useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import StockSelector from './components/StockSelector.jsx'
import MetricCards from './components/MetricCards.jsx'
import HistoricalChart from './components/HistoricalChart.jsx'
import PerformanceTable from './components/PerformanceTable.jsx'
import api from './api/client.js'

const STOCKS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS']
const DAY_OPTIONS = [
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: '2Y', days: 730 },
  { label: '5Y', days: 1825 },
]

export default function App() {
  const [selectedStock, setSelectedStock] = useState('RELIANCE.NS')
  const [historyDays, setHistoryDays] = useState(365)
  const [history, setHistory] = useState([])
  const [predictions, setPredictions] = useState([])
  const [performance, setPerformance] = useState([])
  const [globalLoading, setGlobalLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/api/predictions/all'),
      api.get('/api/analytics/performance'),
    ])
      .then(([predsRes, perfRes]) => {
        setPredictions(predsRes.data.predictions)
        setPerformance(perfRes.data.data)
      })
      .catch(console.error)
      .finally(() => setGlobalLoading(false))
  }, [])

  useEffect(() => {
    setChartLoading(true)
    api.get(`/api/stocks/${selectedStock}/history?days=${historyDays}`)
      .then(res => setHistory(res.data.data))
      .catch(console.error)
      .finally(() => setChartLoading(false))
  }, [selectedStock, historyDays])

  const currentPrediction = predictions.find(p => p.symbol === selectedStock)

  if (globalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading models and data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Portfolio Overview */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-base font-semibold text-white mb-1">Portfolio Overview</h2>
          <p className="text-xs text-gray-500 mb-5">5-year performance summary across all stocks</p>
          <PerformanceTable data={performance} />
        </div>

        {/* Stock-specific section */}
        <StockSelector stocks={STOCKS} selected={selectedStock} onSelect={setSelectedStock} />

        {currentPrediction && <MetricCards prediction={currentPrediction} />}

        {/* Historical Chart */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Price History & Technical Indicators</h2>
              <p className="text-xs text-gray-500 mt-0.5">{selectedStock}</p>
            </div>
            <div className="flex gap-1.5">
              {DAY_OPTIONS.map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => setHistoryDays(days)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    historyDays === days
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {chartLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <HistoricalChart data={history} />
          )}
        </div>

      </main>
    </div>
  )
}
