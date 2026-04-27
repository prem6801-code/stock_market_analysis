const SHORT = {
  'RELIANCE.NS': 'RELIANCE',
  'TCS.NS': 'TCS',
  'INFY.NS': 'INFY',
  'HDFCBANK.NS': 'HDFCBK',
  'ICICIBANK.NS': 'ICICIBK',
}

// Map 0→1 to a blue-green gradient
function cellStyle(val) {
  const hue = Math.round(220 - val * 100) // 220 (blue) → 120 (green)
  const sat = 60
  const light = 30 + val * 15
  return {
    backgroundColor: `hsl(${hue}, ${sat}%, ${light}%)`,
    color: val > 0.6 ? '#e5e7eb' : '#9ca3af',
  }
}

export default function CorrelationMatrix({ data }) {
  const { stocks, matrix } = data
  const names = stocks.map(s => SHORT[s] || s)

  return (
    <div className="overflow-auto">
      <table className="w-full text-xs border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-16" />
            {names.map(n => (
              <th key={n} className="text-center text-gray-500 font-medium pb-1">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={stocks[i]}>
              <td className="text-gray-500 font-medium text-right pr-2">{names[i]}</td>
              {row.map((val, j) => (
                <td
                  key={j}
                  className="text-center font-semibold rounded py-2 px-1"
                  style={cellStyle(val)}
                >
                  {val.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
