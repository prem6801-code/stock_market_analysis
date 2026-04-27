const DISPLAY = {
  'RELIANCE.NS': 'Reliance',
  'TCS.NS': 'TCS',
  'INFY.NS': 'Infosys',
  'HDFCBANK.NS': 'HDFC Bank',
  'ICICIBANK.NS': 'ICICI Bank',
}

export default function StockSelector({ stocks, selected, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {stocks.map(symbol => (
        <button
          key={symbol}
          onClick={() => onSelect(symbol)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selected === symbol
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
          }`}
        >
          {DISPLAY[symbol] || symbol}
        </button>
      ))}
    </div>
  )
}
