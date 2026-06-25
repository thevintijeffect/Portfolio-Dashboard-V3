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
  ArrowLeft,
  BarChart3
} from "lucide-react"
import { motion } from "framer-motion"

const API = "https://portfolio-dashboard-backend-4ull.onrender.com"
const COLORS = ["#00D4FF", "#00E5A0", "#FFB830", "#8B5CF6", "#FF4D6A"]

export default function App() {
  const [loading, setLoading] = useState(true)
  const [portfolio, setPortfolio] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshTs, setRefreshTs] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [selected, setSelected] = useState(null)
  const [holdings, setHoldings] = useState([])
  const [holdingsLoading, setHoldingsLoading] = useState(false)

  async function loadAll() {
    const [resPortfolio, resAnalytics] = await Promise.all([
      fetch(`${API}/portfolio`),
      fetch(`${API}/analytics`)
    ])
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
  }, [activeTab, selected])

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
    () => Object.entries(portfolio?.allocation || {}).map(([k, v]) => ({ name: k, value: v })),
    [portfolio]
  )

  const countries = useMemo(
    () => Object.entries(portfolio?.currency_exposure || {}).map(([k, v]) => ({ country: k, value: v })),
    [portfolio]
  )

  const assetClasses = portfolio?.asset_class_breakdown || []

  const filteredAssetClasses = assetClasses.filter(row =>
    (row.asset_class || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentHoldings = useMemo(() => {
    return holdings.filter(h =>
      (h.asset || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [holdings, searchTerm])

  const selectedTotals = useMemo(() => {
    const totalMarket = currentHoldings.reduce((a, b) => a + (b.market_value || 0), 0)
    const totalInvestment = currentHoldings.reduce((a, b) => a + (b.investment_value || 0), 0)
    const totalGain = currentHoldings.reduce((a, b) => a + (b.unrealised_gain || 0), 0)
    const totalPortfolio = currentHoldings.reduce((a, b) => a + (b.portfolio_pct || 0), 0)
    const totalMarketSGD = currentHoldings.reduce((a, b) => a + (b.value_sgd || 0), 0)
    const totalInvestmentSGD = currentHoldings.reduce((a, b) => a + (b.investment_sgd || 0), 0)
    const totalGainSGD = currentHoldings.reduce((a, b) => a + (b.profit_sgd || 0), 0)
    return { totalMarket, totalInvestment, totalGain, totalPortfolio, totalMarketSGD, totalInvestmentSGD, totalGainSGD }
  }, [currentHoldings])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark text-white">
        <div className="text-2xl font-semibold">Loading Portfolio...</div>
      </div>
    )
  }

  if (!portfolio || !analytics) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark text-white">
        <div className="text-2xl font-semibold">Unable to load dashboard</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
        <header className="mb-6">
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
                  placeholder="Search..."
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
        </header>

        <div className="flex gap-2 mb-6 bg-card border border-border p-1 rounded-2xl w-fit">
          {[
            { key: "overview", label: "Overview" },
            { key: "holdings", label: "Holdings" },
            { key: "analytics", label: "Analytics" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                setSearchTerm("")
              }}
              className={`px-4 py-2 rounded-xl transition-colors ${
                activeTab === tab.key ? "bg-primary text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* keep your overview section here */}
          </div>
        )}

        {activeTab === "holdings" && (
          <div className="space-y-6">
            {/* keep your holdings section here */}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* keep your analytics section here */}
          </div>
        )}
      </div>
    </div>
  )
}
