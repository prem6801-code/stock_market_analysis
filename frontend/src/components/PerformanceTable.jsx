const DISPLAY = {
  'RELIANCE.NS': 'Reliance',
  'TCS.NS': 'TCS',
  'INFY.NS': 'Infosys',
  'HDFCBANK.NS': 'HDFC Bank',
  'ICICIBANK.NS': 'ICICI Bank',
}

export default function PerformanceTable({ data }) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
            <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">5Y Return</th>
            <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Volatility</th>
            <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">52W Range</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {data.map(row => {
            const up = row.total_return >= 0
            return (
              <tr key={row.symbol} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 font-medium text-gray-200">{DISPLAY[row.symbol] || row.symbol}</td>
                <td className="py-3 text-right text-white font-mono">
                  ₹{row.current_price.toLocaleString('en-IN')}
                </td>
                <td className={`py-3 text-right font-semibold font-mono ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {up ? '+' : ''}{row.total_return.toFixed(1)}%
                </td>
                <td className="py-3 text-right text-gray-400 font-mono">
                  ₹{row.volatility.toFixed(0)}
                </td>
                <td className="py-3 text-right text-gray-500 text-xs">
                  ₹{row.min_price.toLocaleString('en-IN')} – ₹{row.max_price.toLocaleString('en-IN')}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
