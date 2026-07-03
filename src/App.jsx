import { useEffect, useMemo, useState } from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  Globe,
  RefreshCw,
  Search,
  ChevronDown,
  Layers3,
  ShieldAlert,
  Wallet,
  LineChart,
  ArrowLeft,
  BarChart3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Home
} from "lucide-react"
import { motion } from "framer-motion"
import CashGroupedView from "./components/CashGroupedView"

const API = "https://portfolio-dashboard-backend-4ull.onrender.com"
const COLORS = ["#00D4FF", "#00E5A0", "#FFB830", "#8B5CF6", "#FF4D6A"]

const money0 = v => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })
const money2 = v => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct2 = v => `${Number(v || 0).toFixed(2)}%`
const textSortValue = v => String(v ?? "").toLowerCase()

export default function App() {
  const [loading, setLoading] = useState(true)
  const [portfolio, setPortfolio] = useState({})
  const [analytics, setAnalytics] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshTs, setRefreshTs] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [selected, setSelected] = useState(null)
  const [holdingsByClass, setHoldingsByClass] = useState({})
  const [holdingsLoading, setHoldingsLoading] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: "asset", direction: "asc" })
  const [cashExpanded, setCashExpanded] = useState({
    "MM Funds": true,
    "SG Account balances": true,
    "Foreign Cash Accounts": true
  })

  async function fetchPortfolio() {
    const [resPortfolio, resAnalytics] = await Promise.all([
      fetch(`${API}/portfolio`),
      fetch(`${API}/analytics`)
    ])
    const [dataPortfolio, dataAnalytics] = await Promise.all([
      resPortfolio.json(),
      resAnalytics.json()
    ])
    setPortfolio(dataPortfolio || {})
    setAnalytics(dataAnalytics || {})
    setRefreshTs(new Date().toLocaleString())
    return dataPortfolio
  }

  async function loadHoldings(assetClass) {
    if (!assetClass) return []

    const existing = holdingsByClass[assetClass]
    if (existing?.length) return existing

    setHoldingsLoading(true)
    try {
      const res = await fetch(`${API}/holdings/${assetClass}`)
      const data = await res.json()
      const arr = Array.isArray(data) ? data : data?.groups ? data : []
      setHoldingsByClass(prev => ({ ...prev, [assetClass]: arr }))
      return arr
    } catch (err) {
      console.log(err)
      setHoldingsByClass(prev => ({ ...prev, [assetClass]: [] }))
      return []
    } finally {
      setHoldingsLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const dataPortfolio = await fetchPortfolio()
        const firstClass = dataPortfolio?.asset_class_breakdown?.[0]?.asset_class
        if (firstClass) {
          setSelected(firstClass)
          fetch(`${API}/holdings/${firstClass}`)
            .then(r => r.json())
            .then(data => {
              const arr = Array.isArray(data) ? data : data?.groups ? data : []
              setHoldingsByClass(prev => ({ ...prev, [firstClass]: arr }))
            })
            .catch(() => {})
        }
      } catch (err) {
        console.log(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (activeTab === "holdings" && selected && !holdingsByClass[selected] && !holdingsLoading) {
      loadHoldings(selected)
    }
  }, [selected, activeTab])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const dataPortfolio = await fetchPortfolio()
      if (activeTab === "holdings" && selected) {
        await loadHoldings(selected)
      } else if (!selected && dataPortfolio?.asset_class_breakdown?.[0]?.asset_class) {
        const firstClass = dataPortfolio.asset_class_breakdown[0].asset_class
        setSelected(firstClass)
        await loadHoldings(firstClass)
      }
    } catch (err) {
      console.log(err)
    } finally {
      setRefreshing(false)
    }
  }

  const allocation = useMemo(
    () => Object.entries(portfolio.allocation || {}).map(([k, v]) => ({ name: k, value: v })),
    [portfolio]
  )

  const countries = useMemo(
    () => Object.entries(portfolio.currency_exposure || {}).map(([k, v]) => ({ country: k, value: v })),
    [portfolio]
  )

  const assetClasses = portfolio.asset_class_breakdown || []

  const filteredAssetClasses = useMemo(
    () => assetClasses.filter(row => row.asset_class?.toLowerCase().includes(searchTerm.toLowerCase())),
    [assetClasses, searchTerm]
  )

  const assetTotals = useMemo(() => {
    return filteredAssetClasses.reduce(
      (acc, row) => {
        acc.investment += Number(row.investment_sgd || 0)
        acc.value += Number(row.value_sgd || 0)
        acc.profit += Number(row.profit_sgd || 0)
        return acc
      },
      { investment: 0, value: 0, profit: 0 }
    )
  }, [filteredAssetClasses])

  const totalProfitPct = assetTotals.investment > 0 ? (assetTotals.profit / assetTotals.investment) * 100 : 0

  const totalPortfolioPct =
    portfolio.summary?.networth_sgd > 0
      ? (assetTotals.value / portfolio.summary.networth_sgd) * 100
      : 0

  const currentHoldings = useMemo(() => {
    if (activeTab !== "holdings" || !selected) return []
    const data = holdingsByClass[selected]
    if (!data) return []
    return Array.isArray(data)
      ? data.filter(h => (h.asset || "").toLowerCase().includes(searchTerm.toLowerCase()))
      : []
  }, [holdingsByClass, searchTerm, activeTab, selected])

  const sortedHoldings = useMemo(() => {
    const arr = [...currentHoldings]
    const { key, direction } = sortConfig
    const dir = direction === "asc" ? 1 : -1
    arr.sort((a, b) => {
      const av = a?.[key]
      const bv = b?.[key]
      const aNum = Number(av)
      const bNum = Number(bv)
      const bothNum = Number.isFinite(aNum) && Number.isFinite(bNum) && av !== "" && bv !== ""
      if (bothNum) return (aNum - bNum) * dir
      return textSortValue(av).localeCompare(textSortValue(bv)) * dir
    })
    return arr
  }, [currentHoldings, sortConfig])

  const handleSort = key => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }))
  }

  const sortIcon = key => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4 opacity-60" />
    return sortConfig.direction === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }

  const renderSortHeader = (label, key, align = "left") => (
    <th
      onClick={() => handleSort(key)}
      className={`py-3 font-semibold cursor-pointer select-none ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <span className={`inline-flex items-center gap-2 ${align === "right" ? "justify-end" : "justify-start"}`}>
        {label}
        {sortIcon(key)}
      </span>
    </th>
  )

  if (loading || !portfolio.summary) {
    return (
      <div className="min-h-screen bg-dark text-white p-4 sm:p-6 lg:p-8">
        <SkeletonHeader />
        <SkeletonCards />
        <SkeletonTable />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Wallet className="w-9 h-9 text-primary" />
                <h1 className="text-3xl lg:text-4xl font-bold">Portfolio Dashboard</h1>
              </div>
              {refreshTs && <p className="text-sm text-gray-500 mt-2">Last updated: {refreshTs}</p>}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={activeTab === "holdings" ? "Search holdings..." : "Search asset classes..."}
                  className="bg-transparent outline-none text-white placeholder:text-gray-500 w-full lg:w-72"
                />
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </motion.header>

        <div className="flex flex-wrap gap-2 mb-6 bg-card border border-border p-1 rounded-2xl w-fit">
          {[
            { key: "overview", label: "Overview", icon: Home },
            { key: "holdings", label: "Holdings", icon: Layers3 },
            { key: "analytics", label: "Analytics", icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setSearchTerm("")
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  activeTab === tab.key ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === "overview" && (
          <>
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6"
            >
              <div className="xl:col-span-2 bg-card border border-border rounded-3xl p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Net Worth</p>
                    <h2 className="text-4xl lg:text-5xl font-bold">SGD {money0(portfolio.summary.networth_sgd)}</h2>
                    <p className="text-sm text-gray-500 mt-2">Total Profit: SGD {money0(portfolio.summary.profit_sgd)}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 bg-dark px-4 py-3 rounded-2xl border border-border">
                    <LineChart className="w-5 h-5 text-primary" />
                    <span className="text-sm text-gray-300">Calm overview</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    icon={<DollarSign className="w-5 h-5 text-primary" />}
                    label="Net Worth (SGD)"
                    value={money0(portfolio.summary.networth_sgd)}
                  />
                  <StatCard
                    icon={<TrendingUp className="w-5 h-5 text-success" />}
                    label="Total Profit (SGD)"
                    value={money0(portfolio.summary.profit_sgd)}
                    positive={portfolio.summary.profit_sgd >= 0}
                  />
                  <StatCard
                    icon={<PieIcon className="w-5 h-5 text-yellow-400" />}
                    label="Asset Classes"
                    value={(assetClasses.length || 0).toString()}
                  />
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-6 lg:p-8 mb-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Layers3 className="w-5 h-5 text-primary" />
                  Asset Classes
                </h2>
                <span className="text-sm text-gray-500">Tap a row to view holdings</span>
              </div>

             <div className="overflow-x-auto">
  <table className="w-full min-w-[900px]">
    <thead>
      <tr className="border-b border-border text-sm text-gray-400">
        {renderSortHeader("Asset Class", "asset_class")}
        {renderSortHeader("Current (SGD)", "value_sgd", "right")}
        {renderSortHeader("Invested (SGD)", "investment_sgd", "right")}
        {renderSortHeader("Profit (SGD)", "profit_sgd", "right")}
        {renderSortHeader("Profit %", "profit_pct", "right")}
        {renderSortHeader("Portfolio %", "portfolio_pct", "right")}
      </tr>
    </thead>
    <tbody>
      {filteredAssetClasses.map((row, i) => (
        <motion.tr
          key={i}
          onClick={() => {
            setSelected(row.asset_class)
            setActiveTab("holdings")
          }}
          className="border-b border-border/60 cursor-pointer hover:bg-hover transition-colors"
          whileHover={{ x: 3 }}
        >
          <td className="py-4 font-semibold">{row.asset_class}</td>
          <td className="py-4 text-right">{money0(row.value_sgd)}</td>
          <td className="py-4 text-right">{money0(row.investment_sgd)}</td>
          <td className={`py-4 text-right font-semibold ${Number(row.profit_sgd || 0) >= 0 ? "text-success" : "text-danger"}`}>
            {money0(row.profit_sgd)}
          </td>
          <td className={`py-4 text-right font-semibold ${Number(row.profit_pct || 0) >= 0 ? "text-success" : "text-danger"}`}>
            {pct2(row.profit_pct)}
          </td>
          <td className="py-4 text-right">{pct2(row.portfolio_pct)}</td>
        </motion.tr>
      ))}

      <tr className="border-t border-border bg-dark/60 font-semibold">
        <td className="py-4">Total</td>
        <td className="py-4 text-right">{money0(assetTotals.value)}</td>
        <td className="py-4 text-right">{money0(assetTotals.investment)}</td>
        <td className={`py-4 text-right ${assetTotals.profit >= 0 ? "text-success" : "text-danger"}`}>
          {money0(assetTotals.profit)}
        </td>
        <td className={`py-4 text-right ${totalProfitPct >= 0 ? "text-success" : "text-danger"}`}>
          {pct2(totalProfitPct)}
        </td>
        <td className="py-4 text-right">{pct2(totalPortfolioPct)}</td>
      </tr>
    </tbody>
  </table>
</div>
            </motion.section>
          </>
        )}

        {activeTab === "holdings" && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-4 sm:p-6 lg:p-8"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-5">
              <div>
                <h2 className="text-2xl font-semibold">Holdings Drill-Down</h2>
                <p className="text-sm text-gray-500 mt-1">Search, sort, and review holdings by asset class.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selected && (
                  <button
                    onClick={() => setSelected(null)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-3 py-2 rounded-xl border border-border"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Search className="w-4 h-4" />
                  {selected || "No asset class selected"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
              <div className="bg-dark/50 border border-border rounded-2xl p-4 h-fit">
                <div className="text-sm text-gray-400 mb-3">Asset classes</div>
                <div className="space-y-2">
                  {assetClasses.map((row, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelected(row.asset_class)
                        setSearchTerm("")
                        setSortConfig({ key: "asset", direction: "asc" })
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                        selected === row.asset_class
                          ? "bg-primary/15 border-primary text-white"
                          : "bg-transparent border-border text-gray-300 hover:bg-hover"
                      }`}
                    >
                      <div className="font-semibold">{row.asset_class}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        SGD {money0(row.value_sgd)} • {pct2(row.portfolio_pct)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {selected === "Cash" ? (
                  <CashGroupedView
                    cashGroups={portfolio.cash_groups?.groups || []}
                    grandTotal={portfolio.cash_groups?.grand_total || {}}
                    expanded={cashExpanded}
                    setExpanded={setCashExpanded}
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      <SummaryTile
                        label="Market Value"
                        value={money0(currentHoldings.reduce((a, b) => a + Number(b.market_value || 0), 0))}
                      />
                      <SummaryTile
                        label="Investment"
                        value={money0(currentHoldings.reduce((a, b) => a + Number(b.investment_value || 0), 0))}
                      />
                      <SummaryTile
                        label="Gain"
                        value={money0(currentHoldings.reduce((a, b) => a + Number(b.unrealised_gain || 0), 0))}
                        positive={currentHoldings.reduce((a, b) => a + Number(b.unrealised_gain || 0), 0) >= 0}
                      />
                      <SummaryTile
                        label="Portfolio %"
                        value={pct2(currentHoldings.reduce((a, b) => a + Number(b.portfolio_pct || 0), 0))}
                      />
                    </div>

                    <div className="bg-dark/40 border border-border rounded-2xl overflow-hidden">
                      <div className="max-h-[60vh] overflow-y-auto hidden sm:block">
                        <table className="w-full min-w-[1100px]">
                          <thead className="sticky top-0 z-10 bg-dark/95 backdrop-blur border-b border-border">
                            <tr className="text-sm text-gray-400">
                              {renderSortHeader("Name", "asset")}
                              {renderSortHeader("Qty", "qty", "right")}
                              {renderSortHeader("Price", "current_price", "right")}
                              {renderSortHeader("Market Value", "market_value", "right")}
                              {renderSortHeader("Investment", "investment_value", "right")}
                              {renderSortHeader("Gain", "unrealised_gain", "right")}
                              {renderSortHeader("Gain %", "unrealised_gain_pct", "right")}
                              {renderSortHeader("Portfolio %", "portfolio_pct", "right")}
                            </tr>
                          </thead>
                          <tbody>
                            {holdingsLoading ? (
                              <tr>
                                <td colSpan={8} className="py-8 text-center text-gray-400">
                                  Loading holdings...
                                </td>
                              </tr>
                            ) : sortedHoldings.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="py-8 text-center text-gray-400">
                                  No holdings found for {selected || "this asset class"}.
                                </td>
                              </tr>
                            ) : (
                              sortedHoldings.map((h, i) => (
                                <tr key={i} className="border-b border-border/60 hover:bg-hover transition-colors">
                                  <td className="py-4 px-4 font-semibold">{h.asset || "-"}</td>
                                  <td className="py-4 px-4 text-right">{money0(h.qty)}</td>
                                  <td className="py-4 px-4 text-right">{money2(h.current_price)}</td>
                                  <td className="py-4 px-4 text-right">{money0(h.market_value)}</td>
                                  <td className="py-4 px-4 text-right">{money0(h.investment_value)}</td>
                                  <td className={`py-4 px-4 text-right font-semibold ${Number(h.unrealised_gain || 0) >= 0 ? "text-success" : "text-danger"}`}>
                                    {money0(h.unrealised_gain)}
                                  </td>
                                  <td className={`py-4 px-4 text-right font-semibold ${Number(h.unrealised_gain_pct || 0) >= 0 ? "text-success" : "text-danger"}`}>
                                    {pct2(h.unrealised_gain_pct)}
                                  </td>
                                  <td className="py-4 px-4 text-right">{pct2(h.portfolio_pct)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {activeTab === "analytics" && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartPanel title="Asset Allocation" icon={<PieIcon className="w-5 h-5 text-primary" />}>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111820",
                        border: "1px solid #1C2635",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                    />
                    <Pie data={allocation} dataKey="value" outerRadius={120} innerRadius={68} paddingAngle={2}>
                      {allocation.map((x, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title="Currency Exposure" icon={<Globe className="w-5 h-5 text-primary" />}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={countries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C2635" />
                    <XAxis dataKey="country" stroke="#7F8A9B" tick={{ fill: "#7F8A9B" }} />
                    <YAxis stroke="#7F8A9B" tick={{ fill: "#7F8A9B" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111820",
                        border: "1px solid #1C2635",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                    />
                    <Bar dataKey="value" fill="#00D4FF" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="bg-card rounded-3xl border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                  Diversification
                </h2>
                <div className="text-4xl font-bold mb-2">
                  {analytics.diversification?.score?.toFixed?.(1) || 0}
                </div>
                <p className="text-sm text-gray-400 mb-6">/ 100 score</p>
                <div className="space-y-3">
                  <MiniMetric
                    label="Largest holding"
                    value={`${analytics.concentration?.largest_holding_pct?.toFixed?.(1) || 0}%`}
                  />
                  <MiniMetric
                    label="Top 5"
                    value={`${analytics.concentration?.top5_pct?.toFixed?.(1) || 0}%`}
                  />
                  <MiniMetric
                    label="Top 10"
                    value={`${analytics.concentration?.top10_pct?.toFixed?.(1) || 0}%`}
                  />
                </div>
              </div>

              <div className="xl:col-span-2 bg-card rounded-3xl border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-danger" />
                  Risk Signals
                </h2>
                {analytics.risk_signals?.length ? (
                  <ul className="space-y-3">
                    {analytics.risk_signals.map((risk, i) => (
                      <li key={i} className="flex items-center gap-2 text-danger">
                        <ChevronDown className="w-4 h-4" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400">No major risk signals detected.</div>
                )}
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, positive = true }) {
  return (
    <div className="bg-dark/70 border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        {icon}
        {value && (
          <span className={`text-sm font-semibold ${positive ? "text-success" : "text-danger"}`}>
            {positive ? "▲" : "▼"}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function MiniMetric({ label, value }) {
  return (
    <div className="flex items-center justify-between bg-dark/60 border border-border rounded-2xl px-4 py-3">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function ChartPanel({ title, icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl border border-border p-6"
    >
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </motion.div>
  )
}

function SummaryTile({ label, value, positive = true }) {
  return (
    <div className="bg-dark/60 border border-border rounded-2xl p-4">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={`text-xl font-bold ${positive ? "text-white" : "text-danger"}`}>{value}</div>
    </div>
  )
}

function SkeletonHeader() {
  return (
    <div className="mb-6">
      <div className="h-10 w-72 bg-white/10 rounded-xl animate-pulse mb-3" />
      <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
    </div>
  )
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div className="h-40 bg-white/10 rounded-3xl animate-pulse" />
      <div className="h-40 bg-white/10 rounded-3xl animate-pulse" />
      <div className="h-40 bg-white/10 rounded-3xl animate-pulse" />
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="bg-white/5 border border-border rounded-3xl p-6">
      <div className="h-6 w-48 bg-white/10 rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-white/10 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
