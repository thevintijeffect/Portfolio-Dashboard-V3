import { ChevronDown, ChevronUp } from "lucide-react"

const money0 = v => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })
const pct2 = v => `${Number(v || 0).toFixed(2)}%`

export default function CashGroupedView({ cashGroups = [], grandTotal = {}, expanded = {}, setExpanded }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryTile label="Cash Market" value={money0(grandTotal.market_value)} />
        <SummaryTile label="Cash Invest" value={money0(grandTotal.investment_value)} />
        <SummaryTile label="Cash Gain" value={money0(grandTotal.profit_sgd)} positive={Number(grandTotal.profit_sgd || 0) >= 0} />
        <SummaryTile label="Cash SGD" value={`SGD ${money0(grandTotal.value_sgd)}`} />
      </div>

      <div className="space-y-3">
        {cashGroups.map((group, idx) => {
          const isOpen = expanded[group.group_name] ?? true

          return (
            <div key={idx} className="rounded-2xl border border-border bg-dark/40 overflow-hidden">
              <button
                onClick={() => setExpanded(prev => ({ ...prev, [group.group_name]: !isOpen }))}
                className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-hover transition-colors"
              >
                <div>
                  <div className="font-semibold text-lg">{group.group_name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Subtotal: SGD {money0(group.subtotal.value_sgd)} • Gain: SGD {money0(group.subtotal.profit_sgd)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {isOpen && (
                <div className="border-t border-border">
                  <div className="overflow-x-auto hidden sm:block">
                    <table className="w-full min-w-[1000px]">
  <thead>
    <tr className="border-b border-border text-sm text-gray-400">
      <th className="py-3 text-left font-semibold">Name</th>
      <th className="py-3 text-right font-semibold">Market Value (SGD)</th>
      <th className="py-3 text-right font-semibold">Investment (SGD)</th>
      <th className="py-3 text-right font-semibold">Gain</th>
      <th className="py-3 text-right font-semibold">Gain %</th>
    </tr>
  </thead>

  <tbody>
    {group.rows.map((h, i) => (
      <tr key={i} className="border-b border-border/60">
        <td className="py-4 font-semibold">{h.asset || "-"}</td>
        <td className="py-4 text-right">{money0(h.market_value)}</td>
        <td className="py-4 text-right">{money0(h.investment_value)}</td>
        <td className={`py-4 text-right font-semibold ${Number(h.unrealised_gain || 0) >= 0 ? "text-success" : "text-danger"}`}>
          {money0(h.unrealised_gain)}
        </td>
        <td className={`py-4 text-right font-semibold ${Number(h.unrealised_gain_pct || 0) >= 0 ? "text-success" : "text-danger"}`}>
          {pct2(h.unrealised_gain_pct)}
        </td>
      </tr>
    ))}

    <tr className="border-t border-border bg-hover/40 font-semibold">
      <td className="py-4">Subtotal</td>
      <td className="py-4 text-right">{money0(group.subtotal?.market_value)}</td>
      <td className="py-4 text-right">{money0(group.subtotal?.investment_value)}</td>
      <td className={`py-4 text-right ${Number(group.subtotal?.profit_sgd || 0) >= 0 ? "text-success" : "text-danger"}`}>
        {money0(group.subtotal?.profit_sgd)}
      </td>
      <td className="py-4 text-right">
        {group.subtotal?.investment_value > 0
          ? pct2((group.subtotal.profit_sgd / group.subtotal.investment_value) * 100)
          : "0.00%"}
      </td>
    </tr>
  </tbody>
</table>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between font-semibold">
        <span>Grand Total</span>
        <span>SGD {money0(grandTotal.value_sgd)}</span>
      </div>
    </div>
  )
}

function SummaryTile({ label, value, positive = true }) {
  return (
    <div className="bg-dark/60 border border-border rounded-2xl p-4">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={`text-xl font-bold ${positive ? "text-white" : "text-danger"}`}>
        {value}
      </div>
    </div>
  )
}
