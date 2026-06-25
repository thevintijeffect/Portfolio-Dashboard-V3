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
  BarChart3
} from "lucide-react"
import { motion } from "framer-motion"

const API = "https://portfolio-dashboard-backend-4ull.onrender.com"
const COLORS = ["#00D4FF", "#00E5A0", "#FFB830", "#8B5CF6", "#FF4D6A"]

export default function App() {
  const [loading, setLoading] = useState(true)
  const [portfolio, setPortfolio] = useState({})
  const [analytics, setAnalytics] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshTs, setRefreshTs] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [selected, setSelected] = useState(null)
  const [holdings, setHoldings] = useState([])
  const [holdingsLoading, setHoldingsLoading] = useState(false)

  async function loadAll() {
    const resPortfolio = await fetch(`${API}/portfolio`)
    const resAnalytics = await fetch(`${API}/analytics`)
    const dataPortfolio = await resPortfolio.json()
    const dataAnalytics = await resAnalytics.json()
    setPortfolio(dataPortfolio || {})
    setAnalytics(dataAnalytics || {})
    setRefreshTs(new Date().toLocaleString())
  }

  async function loadHoldings(assetClass) {
    if (!assetClass) return
    setHoldingsLoading(true)
    try {
      const res = await fetch(`${API}/holdings/${assetClass}`)
      const data = await res.json()
      setHoldings(Array.isArray(data) ? data : [])
    } catch (err) {
      console.log(err)
      setHoldings([])
    } finally {
      setHoldingsLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        await loadAll()
      } catch (err) {
        console.log(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (activeTab === "holdings" && selected) {
      loadHoldings(selected)
    }
  }, [selected, activeTab])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadAll()
      if (activeTab === "holdings" && selected) {
        await loadHoldings(selected)
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

  const filteredAssetClasses = assetClasses.filter(row =>
    row.asset_class?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentHoldings = useMemo(() => {
    if (activeTab !== "holdings" || !selected) return []
    return holdings.filter(h =>
      (h.asset || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [holdings, searchTerm, activeTab, selected])

  const selectedTotals = useMemo(() => {
    const totalMarket = currentHoldings.reduce((a, b) => a + Number(b.market_value || 0), 0)
    const totalInvestment = currentHoldings.reduce((a, b) => a + Number(b.investment_value || 0), 0)
    const totalGain = currentHoldings.reduce((a, b) => a + Number(b.unrealised_gain || 0), 0)
    const totalPortfolio = currentHoldings.reduce((a, b) => a + Number(b.portfolio_pct || 0), 0)
    const totalMarketSGD = currentHoldings.reduce((a, b) => a + Number(b.value_sgd || 0), 0)
    const totalInvestmentSGD = currentHoldings.reduce((a, b) => a + Number(b.investment_sgd || 0), 0)
    const totalGainSGD = currentHoldings.reduce((a, b) => a + Number(b.profit_sgd || 0), 0)
    return {
      totalMarket,
      totalInvestment,
      totalGain,
      totalPortfolio,
      totalMarketSGD,
      totalInvestmentSGD,
      totalGainSGD
    }
  }, [currentHoldings])

  if (loading || !portfolio.summary) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-2xl font-semibold">Loading Portfolio...</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    activeTab === "holdings"
                      ? "Search holdings..."
                      : "Search asset classes..."
                  }
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

        <div className="flex gap-2 mb-6 bg-card border border-border p-1 rounded-2xl w-fit">
          {[
            { key: "overview", label: "Overview", icon: Wallet },
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
                    <h2 className="text-4xl lg:text-5xl font-bold">
                      SGD {portfolio.summary.networth_sgd.toLocaleString()}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                      Total Profit: SGD {portfolio.summary.profit_sgd.toLocaleString()}
                    </p>
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
                    value={portfolio.summary.networth_sgd.toLocaleString()}
                  />
                  <StatCard
                    icon={<TrendingUp className="w-5 h-5 text-success" />}
                    label="Total Profit (SGD)"
                    value={portfolio.summary.profit_sgd.toLocaleString()}
                    positive={portfolio.summary.profit_sgd >= 0}
                  />
                  <StatCard
                    icon={<PieIcon className="w-5 h-5 text-yellow-400" />}
                    label="Asset Classes"
                    value={(assetClasses.length || 0).toString()}
                  />
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-6">
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
                      <th className="py-3 text-left font-semibold">Asset Class</th>
                      <th className="py-3 text-right font-semibold">Invested (SGD)</th>
                      <th className="py-3 text-right font-semibold">Current (SGD)</th>
                      <th className="py-3 text-right font-semibold">Profit (SGD)</th>
                      <th className="py-3 text-right font-semibold">Profit %</th>
                      <th className="py-3 text-right font-semibold">Portfolio %</th>
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
                        <td className="py-4 text-right">{Number(row.investment_sgd || 0).toLocaleString()}</td>
                        <td className="py-4 text-right">{Number(row.value_sgd || 0).toLocaleString()}</td>
                        <td className={`py-4 text-right font-semibold ${Number(row.profit_sgd || 0) >= 0 ? "text-success" : "text-danger"}`}>
                          {Number(row.profit_sgd || 0) >= 0 ? "▲" : "▼"} {Number(row.profit_sgd || 0).toLocaleString()}
                        </td>
                        <td className={`py-4 text-right font-semibold ${Number(row.profit_pct || 0) >= 0 ? "text-success" : "text-danger"}`}>
                          {Number(row.profit_pct || 0) >= 0 ? "▲" : "▼"} {Number(row.profit_pct || 0).toFixed(2)}%
                        </td>
                        <td className="py-4 text-right">{Number(row.portfolio_pct || 0).toFixed(2)}%</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>

            {analytics.risk_signals?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-900/40 to-pink-900/40 rounded-3xl border border-red-500/25 p-6 lg:p-8"
              >
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingDown className="w-6 h-6 text-danger" />
                  Risk Signals
                </h2>
                <ul className="space-y-2">
                  {analytics.risk_signals.map((risk, i) => (
                    <li key={i} className="flex items-center gap-2 text-danger">
                      <ChevronDown className="w-4 h-4" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}
          </>
        )}

        {activeTab === "holdings" && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-6 lg:p-8"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-5">
              <div>
                <h2 className="text-2xl font-semibold">Holdings Drill-Down</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Select an asset class from the Overview tab or use the list below.
                </p>
              </div>
              <div className="flex items-center gap-2">
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
                  <span>{selected || "No asset class selected"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
              <div className="bg-dark/50 border border-border rounded-2xl p-4">
                <div className="text-sm text-gray-400 mb-3">Asset classes</div>
                <div className="space-y-2">
                  {assetClasses.map((row, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelected(row.asset_class)
                        setHoldings([])
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                        selected === row.asset_class
                          ? "bg-primary/15 border-primary text-white"
                          : "bg-transparent border-border text-gray-300 hover:bg-hover"
                      }`}
                    >
                      <div className="font-semibold">{row.asset_class}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        SGD {Number(row.value_sgd || 0).toLocaleString()} • {Number(row.portfolio_pct || 0).toFixed(2)}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                {!selected ? (
                  <div className="h-full min-h-[300px] flex items-center justify-center text-gray-400 bg-dark/30 border border-border rounded-2xl">
                    Select an asset class to see holdings.
                  </div>
                ) : holdingsLoading ? (
                  <div className="h-full min-h-[300px] flex items-center justify-center text-gray-400 bg-dark/30 border border-border rounded-2xl">
                    Loading holdings...
                  </div>
                ) : currentHoldings.length === 0 ? (
                  <div className="h-full min-h-[300px] flex items-center justify-center text-gray-400 bg-dark/30 border border-border rounded-2xl">
                    No holdings found for {selected}.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      <SummaryTile label="Market Value" value={selectedTotals.totalMarket.toLocaleString()} />
                      <SummaryTile label="Investment" value={selectedTotals.totalInvestment.toLocaleString()} />
                      <SummaryTile
                        label="Gain"
                        value={selectedTotals.totalGain.toLocaleString()}
                        positive={selectedTotals.totalGain >= 0}
                      />
                      <SummaryTile
                        label="Portfolio %"
                        value={`${selectedTotals.totalPortfolio.toFixed(2)}%`}
                      />
                    </div>

                    <div className="bg-dark/40 border border-border rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{selected} Holdings</h3>
                          <p className="text-sm text-gray-500">Showing {currentHoldings.length} items</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                          <thead>
                            <tr className="border-b border-border text-sm text-gray-400">
                              <th className="py-3 text-left font-semibold">Name</th>
                              <th className="py-3 text-right font-semibold">Qty</th>
                              <th className="py-3 text-right font-semibold">Price</th>
                              <th className="py-3 text-right font-semibold">Market Value</th>
                              <th className="py-3 text-right font-semibold">Investment</th>
                              <th className="py-3 text-right font-semibold">Gain</th>
                              <th className="py-3 text-right font-semibold">Gain %</th>
                              <th className="py-3 text-right font-semibold">Portfolio %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentHoldings.map((h, i) => (
                              <tr key={i} className="border-b border-border/60 hover:bg-hover transition-colors">
                                <td className="py-4 font-semibold">{h.asset || "-"}</td>
                                <td className="py-4 text-right">{Number(h.qty || 0).toLocaleString()}</td>
                                <td className="py-4 text-right">{Number(h.current_price || 0).toLocaleString()}</td>
                                <td className="py-4 text-right">{Number(h.market_value || 0).toLocaleString()}</td>
                                <td className="py-4 text-right">{Number(h.investment_value || 0).toLocaleString()}</td>
                                <td className={`py-4 text-right font-semibold ${Number(h.unrealised_gain || 0) >= 0 ? "text-success" : "text-danger"}`}>
                                  {Number(h.unrealised_gain || 0) >= 0 ? "▲" : "▼"} {Number(h.unrealised_gain || 0).toLocaleString()}
                                </td>
                                <td className={`py-4 text-right font-semibold ${Number(h.unrealised_gain_pct || 0) >= 0 ? "text-success" : "text-danger"}`}>
                                  {Number(h.unrealised_gain_pct || 0) >= 0 ? "▲" : "▼"} {Number(h.unrealised_gain_pct || 0).toFixed(2)}%
                                </td>
                                <td className="py-4 text-right">{Number(h.portfolio_pct || 0).toFixed(2)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-5 bg-dark rounded-2xl p-5 border border-border/70 overflow-x-auto">
                        <table className="w-full min-w-[700px] text-sm">
                          <tbody>
                            <tr className="border-b border-border/50">
                              <td className="py-2 font-semibold">TOTAL</td>
                              <td className="py-2 text-right">
                                {selectedTotals.totalMarket.toLocaleString()}
                              </td>
                              <td className="py-2 text-right">
                                {selectedTotals.totalInvestment.toLocaleString()}
                              </td>
                              <td className={`py-2 text-right font-semibold ${selectedTotals.totalGain >= 0 ? "text-success" : "text-danger"}`}>
                                {selectedTotals.totalGain >= 0 ? "▲" : "▼"} {selectedTotals.totalGain.toLocaleString()}
                              </td>
                              <td className="py-2 text-right">
                                {selectedTotals.totalPortfolio.toFixed(2)}%
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 font-semibold">TOTAL SGD</td>
                              <td className="py-2 text-right">
                                SGD {selectedTotals.totalMarketSGD.toLocaleString()}
                              </td>
                              <td className="py-2 text-right">
                                SGD {selectedTotals.totalInvestmentSGD.toLocaleString()}
                              </td>
                              <td className={`py-2 text-right font-semibold ${selectedTotals.totalGainSGD >= 0 ? "text-success" : "text-danger"}`}>
                                {selectedTotals.totalGainSGD >= 0 ? "▲" : "▼"} SGD {selectedTotals.totalGainSGD.toLocaleString()}
                              </td>
                              <td className="py-2 text-right">
                                {selectedTotals.totalPortfolio.toFixed(2)}%
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {activeTab === "analytics" && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
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
                    <Pie
                      data={allocation}
                      dataKey="value"
                      outerRadius={120}
                      innerRadius={68}
                      paddingAngle={2}
                    >
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
      <div className={`text-xl font-bold ${positive ? "text-white" : "text-danger"}`}>
        {value}
      </div>
    </div>
  )
}
