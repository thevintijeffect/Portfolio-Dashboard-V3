import { useEffect, useState } from "react"

const API = "https://portfolio-dashboard-backend-4ull.onrender.com"

export default function App() {
  const [portfolio, setPortfolio] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [p, a] = await Promise.all([
          fetch(`${API}/portfolio`).then(r => r.json()),
          fetch(`${API}/analytics`).then(r => r.json())
        ])
        setPortfolio(p)
        setAnalytics(a)
      } catch (e) {
        console.log(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div style={{ color: "white" }}>Loading...</div>

  return (
    <div style={{ background: "#111", color: "white", minHeight: "100vh", padding: 24 }}>
      <button onClick={() => setActiveTab("overview")}>Overview</button>
      <button onClick={() => setActiveTab("holdings")}>Holdings</button>
      <button onClick={() => setActiveTab("analytics")}>Analytics</button>

      <pre>{JSON.stringify({ portfolio, analytics, activeTab }, null, 2)}</pre>
    </div>
  )
}
