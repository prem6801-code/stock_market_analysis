import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

function formatXTick(d) {
  if (!d || d === 'Next') return d
  const dt = new Date(d)
  return `${dt.getDate()} ${dt.toLocaleString('default', { month: 'short' })}`
}

const tooltipStyle = {
  contentStyle: { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#9ca3af' },
}

export default function PredictionPanel({ data, nextPrediction, loading }) {
  if (loading) {
    return <div className="h-72 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  if (!data.length) {
    return <div className="h-72 flex items-center justify-center text-gray-600 text-sm">No prediction data</div>
  }

  // Append next-day forecast as a final point
  const chartData = nextPrediction
    ? [...data, { date: 'Next', actual: null, predicted: nextPrediction.predicted_price }]
    : data

  const up = nextPrediction?.change >= 0
  const sign = up ? '+' : ''

  return (
    <div>
      {nextPrediction && (
        <div className="flex flex-wrap gap-6 mb-5 text-sm">
          <span className="text-gray-400">
            Last Close:{' '}
            <span className="text-white font-semibold">
              ₹{nextPrediction.last_close.toLocaleString('en-IN')}
            </span>
          </span>
          <span className="text-gray-400">
            Next Day Forecast:{' '}
            <span className={`font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              ₹{nextPrediction.predicted_price.toLocaleString('en-IN')}{' '}
              ({sign}{nextPrediction.change_pct}%)
            </span>
          </span>
          <span className="text-gray-500">
            MAE ₹{nextPrediction.mae} · MAPE {nextPrediction.mape}%
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXTick}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(chartData.length / 8)}
          />
          <YAxis
            tickFormatter={v => `₹${v.toFixed(0)}`}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={68}
            domain={['auto', 'auto']}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value, name) => [value != null ? `₹${Number(value).toFixed(2)}` : '—', name]}
          />
          <Legend wrapperStyle={{ color: '#6b7280', fontSize: 11, paddingTop: 12 }} />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Actual"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#f97316"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            name="Predicted"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
