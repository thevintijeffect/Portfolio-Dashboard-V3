const CashGroupedView = ({ groups = [] }) => {
  const money0 = v => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })
  const pct2 = v => `${Number(v || 0).toFixed(2)}%`

  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{group?.name || "Cash Holdings"}</h3>
              <p className="text-sm text-gray-400">{group?.rows?.length || 0} holdings</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-border text-sm text-gray-400">
                  <th className="py-3 pl-2 pr-3 text-left font-semibold w-[34%]">Name</th>
                  <th className="py-3 px-3 text-right font-semibold w-[22%]">Market Value (SGD)</th>
                  <th className="py-3 px-3 text-right font-semibold w-[22%]">Investment (SGD)</th>
                  <th className="py-3 px-3 text-right font-semibold w-[11%]">Gain</th>
                  <th className="py-3 px-3 text-right font-semibold w-[11%]">Gain %</th>
                </tr>
              </thead>

              <tbody>
                {group?.rows?.map((h, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-hover/40 transition-colors">
                    <td className="py-4 pl-2 pr-3 font-semibold truncate">{h?.asset || "-"}</td>
                    <td className="py-4 px-3 text-right">{money0(h?.market_value)}</td>
                    <td className="py-4 px-3 text-right">{money0(h?.investment_value)}</td>
                    <td className={`py-4 px-3 text-right font-semibold ${Number(h?.unrealised_gain || 0) >= 0 ? "text-success" : "text-danger"}`}>
                      {money0(h?.unrealised_gain)}
                    </td>
                    <td className={`py-4 px-3 text-right font-semibold ${Number(h?.unrealised_gain_pct || 0) >= 0 ? "text-success" : "text-danger"}`}>
                      {pct2(h?.unrealised_gain_pct)}
                    </td>
                  </tr>
                ))}

                <tr className="border-t border-border bg-hover/40 font-semibold">
                  <td className="py-4 pl-2 pr-3">Subtotal</td>
                  <td className="py-4 px-3 text-right">{money0(group?.subtotal?.market_value)}</td>
                  <td className="py-4 px-3 text-right">{money0(group?.subtotal?.investment_value)}</td>
                  <td className={`py-4 px-3 text-right ${Number(group?.subtotal?.profit_sgd || 0) >= 0 ? "text-success" : "text-danger"}`}>
                    {money0(group?.subtotal?.profit_sgd)}
                  </td>
                  <td className="py-4 px-3 text-right">
                    {group?.subtotal?.investment_value > 0
                      ? pct2((group.subtotal.profit_sgd / group.subtotal.investment_value) * 100)
                      : "0.00%"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CashGroupedView
