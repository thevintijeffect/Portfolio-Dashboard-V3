import { useEffect, useState } from "react"
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
  ChevronDown
} from "lucide-react"
import { motion } from "framer-motion"

const API = "https://portfolio-dashboard-backend-4ull.onrender.com"

const COLORS = ["#00D4FF", "#00E5A0", "#FFB830", "#8B5CF6", "#FF4D6A"]

export default function App() {
  const [loading, setLoading] = useState(true)
  const [portfolio, setPortfolio] = useState({})
  const [selected, setSelected] = useState(null)
  const [holdings, setHoldings] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshTs, setRefreshTs] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const resPortfolio = await fetch(`${API}/portfolio`)
        const resAnalytics = await fetch(`${API}/analytics`)
        const dataPortfolio = await resPortfolio.json()
        const dataAnalytics = await resAnalytics.json()
        
        setPortfolio(dataPortfolio)
        setAnalytics(dataAnalytics)
        setRefreshTs(new Date().toLocaleString())
      } catch (err) {
        console.log(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (selected) {
      async function loadHoldings() {
        try {
          const res = await fetch(`${API}/holdings/${selected}`)
          const data = await res.json()
          setHoldings(data)
        } catch (err) {
          console.log(err)
        }
      }
      loadHoldings()
    }
  }, [selected])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const resPortfolio = await fetch(`${API}/portfolio`)
      const resAnalytics = await fetch(`${API}/analytics`)
      const dataPortfolio = await resPortfolio.json()
      const dataAnalytics = await resAnalytics.json()
      
      setPortfolio(dataPortfolio)
      setAnalytics(dataAnalytics)
      setRefreshTs(new Date().toLocaleString())
    } catch (err) {
      console.log(err)
    } finally {
      setRefreshing(false)
    }
  }

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

  const allocation = Object.entries(portfolio.allocation || {}).map(([k, v]) => ({
    name: k,
    value: v
  }))

  const countries = Object.entries(portfolio.currency_exposure || {}).map(([k, v]) => ({
    country: k,
    value: v
  }))

  const grouped = {}
  if (Array.isArray(holdings)) {
    holdings.forEach(h => {
      const curr = h.currency || "Unknown"
      if (!grouped[curr]) grouped[curr] = []
      grouped[curr].push(h)
    })
  }

  const filteredHoldings = holdings.filter(h =>
    h.asset?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-dark text-white p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <DollarSign className="w-10 h-10 text-primary" />
            Portfolio Dashboard
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search holdings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:border-primary w-64 text-white"
              />
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
        
        {refreshTs && (
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {refreshTs}
          </p>
        )}
      </motion.header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <SummaryCard
          icon={<DollarSign className="w-6 h-6 text-primary" />}
          title="Net Worth (SGD)"
          value={portfolio.summary.networth_sgd.toLocaleString()}
          trend="+12.5%"
          trendPositive={true}
        />
        
        <SummaryCard
          icon={<TrendingUp className="w-6 h-6 text-success" />}
          title="Total Profit (SGD)"
          value={portfolio.summary.profit_sgd.toLocaleString()}  
          trend={portfolio.summary.profit_sgd >= 0 ? "+8.2%" : "-3.1%"}
          trendPositive={portfolio.summary.profit_sgd >= 0}
        />
        
        <SummaryCard
          icon={<PieIcon className="w-6 h-6 text-yellow-400" />}
          title="Asset Classes"
          value={portfolio.asset_class_breakdown?.length || 0}
        />
        
        <SummaryCard
          icon={<Globe className="w-6 h-6 text-purple-400" />}
          title="Holdings"
          value={portfolio.holdings?.length || 0}
        />
        
        <SummaryCard
          icon={<TrendingUp className="w-6 h-6 text-pink-400" />}
          title="Diversification"
          value={analytics.diversification?.score?.toFixed(1) || 0}
          subtitle="/ 100"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ChartPanel title="Asset Allocation" icon={<PieIcon className="w-5 h-5 text-primary" />}>
          <ResponsiveContainer width="100%" height={300}>
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
                innerRadius={60}
                paddingAngle={2}
              >
                {allocation.map((x, i) => (
                  <Cell key={i} fill={COLORS[i % 5]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Currency Exposure" icon={<Globe className="w-5 h-5 text-primary" />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2635" />
              <XAxis
                dataKey="country"
                stroke="#7F8A9B"
                tick={{ fill: "#7F8A9B" }}
              />
              <YAxis
                stroke="#7F8A9B"
                tick={{ fill: "#7F8A9B" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111820",
                  border: "1px solid #1C2635",
                  borderRadius: "8px",
                  color: "#fff"
                }}
              />
              <Bar dataKey="value" fill="#00D4FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* Asset Classes Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border p-6 mb-8"
      >
        <h2 className="text-2xl font-semibold mb-4">Asset Classes</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 text-left font-semibold text-gray-400">Asset Class</th>
              <th className="py-3 text-right font-semibold text-gray-400">Invested (SGD)</th>
              <th className="py-3 text-right font-semibold text-gray-400">Current (SGD)</th>
              <th className="py-3 text-right font-semibold text-gray-400">Profit (SGD)  </th>
              <th className="py-3 text-right font-semibold text-gray-400">Profit %</th>
              <th className="py-3 text-right font-semibold text-gray-400">Portfolio %</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.asset_class_breakdown?.map((row, i) => (
              <motion.tr
                key={i}
                onClick={() => setSelected(row.asset_class)}
                className="border-b border-border cursor-pointer hover:bg-hover transition-colors"
                whileHover={{ x: 4 }}
              >
                <td className="py-3 font-semibold">{row.asset_class}</td>
                <td className="py-3 text-right">{row.investment_sgd.toLocaleString()}</td>
                <td className="py-3 text-right">{row.value_sgd.toLocaleString()}</td>
                <td className={`py-3 text-right font-semibold ${row.profit_sgd >= 0 ? 'text-success' : 'text-danger'}`}>
                  {row.profit_sgd >= 0 ? '▲' : '▼'} {row.profit_sgd.toLocaleString()}
                </td>
                <td className={`py-3 text-right font-semibold ${row.profit_pct >= 0 ? 'text-success' : 'text-danger'}`}>
                  {row.profit_pct >= 0 ? '▲' : '▼'} {row.profit_pct}%
                </td>
                <td className="py-3 text-right">{row.portfolio_pct}%</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Individual Holdings */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-2xl font-semibold mb-4">{selected} Holdings</h2>
          
          {Object.entries(grouped).map(([currency, list]) => {
            const totalMarket = list.reduce((a, b) => a + (b.market_value || 0), 0)
            const totalInvestment = list.reduce((a, b) => a + (b.investment_value || 0), 0)
            const totalGain = list.reduce((a, b) => a + (b.unrealised_gain || 0), 0)
            const totalPortfolio = list.reduce((a, b) => a + (b.portfolio_pct || 0), 0)
            const totalMarketSGD = list.reduce((a, b) => a + (b.value_sgd || 0), 0)
            const totalInvestmentSGD = list.reduce((a, b) => a + (b.investment_sgd || 0), 0)
            const totalGainSGD = list.reduce((a, b) => a + (b.profit_sgd || 0), 0)

            return (
              <div key={currency} className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-primary">{currency} Holdings</h3>
                
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 text-left font-semibold text-gray-400">Name</th>
                      <th className="py-3 text-right font-semibold text-gray-400">Qty</th>
                      <th className="py-3 text-right font-semibold text-gray-400">Price</th>
                      <th className="py-3 text-right font-semibold text-gray-400">Market Value</th>
                      <th className="py-3 text-right font-semibold text-gray-400">Investment</th>
                      <th className="py-3 text-right font-semibold text-gray-400">Gain</th>
                      <th className="py-3 text-right font-semibold text-gray-400">Gain%</th>
                      <th className="py-3 text-right font-semibold text-gray-400">Portfolio%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((h, i) => (
                      <motion.tr
                        key={i}
                        className="border-b border-border hover:bg-hover transition-colors"
                        whileHover={{ x: 2 }}
                      >
                        <td className="py-3 font-semibold">{h.asset || "-"}</td>
                        <td className="py-3 text-right">{(h.qty ?? 0).toLocaleString()}</td>
                        <td className="py-3 text-right">{(h.current_price ?? 0).toLocaleString()}</td>
                        <td className="py-3 text-right">{(h.market_value ?? 0).toLocaleString()}</td>
                        <td className="py-3 text-right">{(h.investment_value ?? 0).toLocaleString()}</td>
                        <td className={`py-3 text-right font-semibold ${h.unrealised_gain >= 0 ? 'text-success' : 'text-danger'}`}>
                          {h.unrealised_gain >= 0 ? '▲' : '▼'} {(h.unrealised_gain ?? 0).toLocaleString()}
                        </td>
                        <td className={`py-3 text-right font-semibold ${h.unrealised_gain_pct >= 0 ? 'text-success' : 'text-danger'}`}>
                          {h.unrealised_gain_pct >= 0 ? '▲' : '▼'} {(h.unrealised_gain_pct ?? 0).toFixed(2)}%
                        </td>
                        <td className="py-3 text-right">{(h.portfolio_pct ?? 0).toFixed(2)}%</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mt-4 bg-dark rounded-lg p-4">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="py-2 font-semibold">TOTAL</td>
                        <td className="py-2 text-right">{totalMarket.toLocaleString()}</td>
                        <td className="py-2 text-right">{totalInvestment.toLocaleString()}</td>
                        <td className={`py-2 text-right font-semibold ${totalGain >= 0 ? 'text-success' : 'text-danger'}`}>
                          {totalGain >= 0 ? '▲' : '▼'} {totalGain.toLocaleString()}
                        </td>
                        <td className="py-2 text-right">{totalPortfolio.toFixed(2)}%</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold">TOTAL SGD</td>
                        <td className="py-2 text-right">{totalMarketSGD.toLocaleString()}</td>
                        <td className="py-2 text-right">{totalInvestmentSGD.toLocaleString()}</td>
                        <td className={`py-2 text-right font-semibold ${totalGainSGD >= 0 ? 'text-success' : 'text-danger'}`}>
                          {totalGainSGD >= 0 ? '▲' : '▼'} {totalGainSGD.toLocaleString()}
                        </td>
                        <td className="py-2 text-right">{totalPortfolio.toFixed(2)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* Risk Signals */}
      {analytics.risk_signals && analytics.risk_signals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-red-900/50 to-pink-900/50 rounded-xl border border-red-500/30 p-6 mt-8"
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
        </motion.div>
      )}
    </div>
  )
}

// Summary Card Component
function SummaryCard({ icon, title, value, trend, trendPositive, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl border border-border p-6"
      whileHover={{ y: -4 }}
    >
      <div className="flex items-center justify-between mb-3">
        {icon}
        {trend && (
          <span className={`flex items-center gap-1 text-sm font-semibold ${trendPositive ? 'text-success' : 'text-danger'}`}>
            {trendPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <div className="text-3xl font-bold">{value}{subtitle}</div>
    </motion.div>
  )
}

// Chart Panel Component
function ChartPanel({ title, icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </motion.div>
  )
}
