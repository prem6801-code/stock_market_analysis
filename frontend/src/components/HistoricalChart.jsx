import { useState } from 'react'
import {
  ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const INDICATOR_CONFIG = [
  { key: 'sma20',   label: 'SMA 20',  color: '#f59e0b', dataKey: 'sma_20',   dash: '6 3' },
  { key: 'sma50',   label: 'SMA 50',  color: '#ef4444', dataKey: 'sma_50',   dash: '6 3' },
  { key: 'ema20',   label: 'EMA 20',  color: '#10b981', dataKey: 'ema_20',   dash: '3 2' },
  { key: 'ema50',   label: 'EMA 50',  color: '#8b5cf6', dataKey: 'ema_50',   dash: '3 2' },
  { key: 'bbUpper', label: 'BB Upper',color: '#6366f1', dataKey: 'bb_upper', dash: '4 4' },
  { key: 'bbLower', label: 'BB Lower',color: '#6366f1', dataKey: 'bb_lower', dash: '4 4' },
]

function formatXTick(d) {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.toLocaleString('default', { month: 'short' })} '${String(dt.getFullYear()).slice(2)}`
}

const tooltipStyle = {
  contentStyle: { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#9ca3af' },
}

export default function HistoricalChart({ data }) {
  const [active, setActive] = useState({ sma20: true, sma50: true })

  const toggle = key => setActive(prev => ({ ...prev, [key]: !prev[key] }))

  if (!data.length) {
    return <div className="h-96 flex items-center justify-center text-gray-600 text-sm">No data</div>
  }

  return (
    <div>
      {/* Indicator toggles */}
      <div className="flex flex-wrap gap-2 mb-5">
        {INDICATOR_CONFIG.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
              active[key]
                ? 'border-transparent text-white'
                : 'border-gray-700 text-gray-500 bg-transparent'
            }`}
            style={active[key] ? { backgroundColor: color } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXTick}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="price"
            tickFormatter={v => `₹${v.toFixed(0)}`}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={68}
            domain={['auto', 'auto']}
          />
          <YAxis
            yAxisId="volume"
            orientation="right"
            tickFormatter={v => `${(v / 1e6).toFixed(0)}M`}
            tick={{ fill: '#4b5563', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value, name) => [
              value != null ? `₹${Number(value).toFixed(2)}` : '—',
              name,
            ]}
          />

          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="#1e3a5f"
            opacity={0.7}
            name="Volume"
            maxBarSize={4}
          />

          <Line
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Close"
          />

          {INDICATOR_CONFIG.map(({ key, label, color, dataKey, dash }) =>
            active[key] ? (
              <Line
                key={key}
                yAxisId="price"
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray={dash}
                dot={false}
                name={label}
                connectNulls
              />
            ) : null
          )}

          <Legend
            wrapperStyle={{ color: '#6b7280', fontSize: 11, paddingTop: 12 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
