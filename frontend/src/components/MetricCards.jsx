function Card({ label, value, sub, valueClass }) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${valueClass || 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function MetricCards({ prediction }) {
  const up = prediction.change >= 0
  const sign = up ? '+' : ''
  const changeClass = up ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        label="Current Price"
        value={`₹${prediction.last_close.toLocaleString('en-IN')}`}
        sub="Last closing price"
      />
      <Card
        label="Next Day Prediction"
        value={`₹${prediction.predicted_price.toLocaleString('en-IN')}`}
        sub={`${sign}₹${prediction.change} (${sign}${prediction.change_pct}%)`}
        valueClass={changeClass}
      />
      <Card
        label="Model MAPE"
        value={`${prediction.mape ?? '—'}%`}
        sub="Mean absolute % error"
        valueClass="text-blue-400"
      />
      <Card
        label="Model RMSE"
        value={prediction.rmse ? `₹${prediction.rmse}` : '—'}
        sub="Root mean squared error"
        valueClass="text-violet-400"
      />
    </div>
  )
}
