function MfsGroupedView({ holdings = [], loading = false, money0, money2, pct2 }) {
  const isDirectFund = h => String(h.asset || "").toLowerCase().includes("direct")

  const regularRows = holdings.filter(h => !isDirectFund(h))
  const directRows = holdings.filter(h => isDirectFund(h))

  const calcTotals = rows =>
    rows.reduce(
      (acc, h) => {
        acc.qty += Number(h.qty || 0)
        acc.current_price += Number(h.current_price || 0)
        acc.market_value += Number(h.market_value || 0)
        acc.investment_value += Number(h.investment_value || 0)
        acc.unrealised_gain += Number(h.unrealised_gain || 0)
        acc.unrealised_gain_pct += Number(h.unrealised_gain_pct || 0)
        acc.portfolio_pct += Number(h.portfolio_pct || 0)
        return acc
      },
      {
        qty: 0,
        current_price: 0,
        market_value: 0,
        investment_value: 0,
        unrealised_gain: 0,
        unrealised_gain_pct: 0,
        portfolio_pct: 0
      }
    )

  const regularTotals = calcTotals(regularRows)
  const directTotals = calcTotals(directRows)
  const grandTotals = calcTotals([...regularRows, ...directRows])

  const GroupTable = ({ title, rows, totals }) => (
    <div className="bg-dark/40 border border-border rounded-2xl overflow-hidden min-w-0">
      <div className="px-4 py-3 border-b border-border">
        <div className="font-semibold text-lg">{title}</div>
        <div className="text-xs text-gray-500 mt-1">{rows.length} holdings</div>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full min-w-[1200px] table-fixed">
          <thead className="sticky top-0 z-10 bg-dark/95 backdrop-blur border-b border-border">
            <tr className="text-sm text-gray-400">
              <th className="py-3 px-3 text-left font-semibold w-[30%]">Name</th>
              <th className="py-3 px-3 text-right font-semibold w-[14%]">Qty</th>
              <th className="py-3 px-3 text-right font-semibold w-[14%]">Current Price</th>
              <th className="py-3 px-3 text-right font-semibold w-[15%]">Current Value</th>
              <th className="py-3 px-3 text-right font-semibold w-[15%]">Invested Amount</th>
              <th className="py-3 px-3 text-right font-semibold w-[12%]">Gain</th>
              <th className="py-3 px-3 text-right font-semibold w-[10%]">Gain %</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  No holdings in this section.
                </td>
              </tr>
            ) : (
              rows.map((h, i) => (
                <tr key={i} className="border-b border-border/60 hover:bg-hover transition-colors">
                  <td className="py-4 px-3 font-semibold truncate">{h.asset || "-"}</td>
                  <td className="py-4 px-3 text-right">{money0(h.qty)}</td>
                  <td className="py-4 px-3 text-right">{money2(h.current_price)}</td>
                  <td className="py-4 px-3 text-right">{money0(h.market_value)}</td>
                  <td className="py-4 px-3 text-right">{money0(h.investment_value)}</td>
                  <td className={`py-4 px-3 text-right font-semibold ${Number(h.unrealised_gain || 0) >= 0 ? "text-success" : "text-danger"}`}>
                    {money0(h.unrealised_gain)}
                  </td>
                  <td className={`py-4 px-3 text-right font-semibold ${Number(h.unrealised_gain_pct || 0) >= 0 ? "text-success" : "text-danger"}`}>
                    {pct2(h.unrealised_gain_pct)}
                  </td>
                </tr>
              ))
            )}

            <tr className="border-t border-border bg-dark/70 font-semibold">
              <td className="py-4 px-3">Subtotal</td>
              <td className="py-4 px-3 text-right">{money0(totals.qty)}</td>
              <td className="py-4 px-3 text-right">-</td>
              <td className="py-4 px-3 text-right">{money0(totals.market_value)}</td>
              <td className="py-4 px-3 text-right">{money0(totals.investment_value)}</td>
              <td className={`py-4 px-3 text-right ${totals.unrealised_gain >= 0 ? "text-success" : "text-danger"}`}>
                {money0(totals.unrealised_gain)}
              </td>
              <td className={`py-4 px-3 text-right ${totals.unrealised_gain_pct >= 0 ? "text-success" : "text-danger"}`}>
                {pct2(totals.unrealised_gain_pct)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryTile label="Current Value" value={money0(grandTotals.market_value)} />
        <SummaryTile label="Invested Amount" value={money0(grandTotals.investment_value)} />
        <SummaryTile label="Gain" value={money0(grandTotals.unrealised_gain)} positive={grandTotals.unrealised_gain >= 0} />
      </div>

      {loading ? (
        <div className="bg-dark/40 border border-border rounded-2xl p-8 text-gray-400">
          Loading mutual fund holdings...
        </div>
      ) : (
        <>
          <GroupTable title="Regular" rows={regularRows} totals={regularTotals} />
          <GroupTable title="Direct" rows={directRows} totals={directTotals} />

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between font-semibold">
            <span>Grand Total</span>
            <span>{money0(grandTotals.market_value)}</span>
          </div>
        </>
      )}
    </div>
  )
}
