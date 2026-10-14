import { useCallback, useEffect, useMemo, useState } from "react";

const NAV_GROUPS = [
  { title: "", items: [["overview", "Overview"]] },
  { title: "COST REPORTING", items: [["costs", "Perspectives"], ["categories", "Cost Categories"], ["dashboards", "BI Dashboards"]] },
  { title: "COST OPTIMIZATION", items: [["autostopping", "AutoStopping Rules"], ["recommendations", "Recommendations"], ["commitments", "Commitments"], ["clusters", "Cluster Orchestrator"]] },
  { title: "COST GOVERNANCE", items: [["budgets", "Budgets"], ["assets", "Asset Governance"], ["anomalies", "Anomalies"]] },
];

function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function shortDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function Icon({ name }) {
  const paths = {
    overview: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    categories: "M4 6h16M4 12h10M4 18h7", dashboards: "M3 4h18v16H3zM3 9h18M9 9v11", autostopping: "M4 12h4l3-7 4 14 3-7h2", commitments: "M5 5h14v14H5zM8 9h8M8 13h8M8 17h4", clusters: "M12 3 4 7v10l8 4 8-4V7zM4 7l8 4 8-4M12 11v10", budgets: "M4 5h16v14H4zM8 9h8M8 13h5", assets: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5", anomalies: "M12 3 2.8 20h18.4L12 3Zm0 6v5m0 3v.1",
    costs: "M5 19V9m7 10V5m7 14v-7",
    resources: "M4 7h16M7 4v6m10-6v6M5 20h14a1 1 0 0 0 1-1v-7H4v7a1 1 0 0 0 1 1Z",
    recommendations: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.8L6.6 20l1-6.1-4.4-4.3 6.1-.9L12 3Z",
    refresh: "M20 11a8 8 0 0 0-14.8-4L3 9m0-5v5h5M4 13a8 8 0 0 0 14.8 4L21 15m0 5v-5h-5",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-3.5a7.6 7.6 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7.7 7.7 0 0 0-2.1-1.2L14.5 3h-5l-.4 2.7A7.7 7.7 0 0 0 7 6.9l-2.4-1-2 3.4 2 1.5a7.6 7.6 0 0 0-.1 1.2 7.6 7.6 0 0 0 .1 1.2l-2 1.5 2 3.4 2.4-1a7.7 7.7 0 0 0 2.1 1.2l.4 2.7h5l.4-2.7a7.7 7.7 0 0 0 2.1-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path d={paths[name] || paths.overview} />
    </svg>
  );
}

function StatCard({ label, value, detail, tone = "default" }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <span className="stat-detail">{detail}</span>
    </article>
  );
}

function CostChart({ data, currency }) {
  if (!data?.length) return <div className="empty">No cost data for this period.</div>;
  const max = Math.max(...data.map((x) => Number(x.amount) || 0), 1);
  const points = data.map((item, index) => {
    const x = 20 + (index / Math.max(data.length - 1, 1)) * 460;
    const y = 185 - ((Number(item.amount) || 0) / max) * 145;
    return { x, y, item };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `20,185 ${line} 480,185`;

  return (
    <div className="chart-wrap">
      <svg viewBox="0 0 500 220" className="chart" role="img" aria-label="Daily cloud spend trend">
        {[40, 88, 136, 185].map((y) => <line key={y} x1="20" x2="480" y1={y} y2={y} className="grid-line" />)}
        <polygon points={area} className="chart-area" />
        <polyline points={line} className="chart-line" />
        {points.map(({ x, y, item }) => (
          <g key={item.date}>
            <circle cx={x} cy={y} r="3.5" className="chart-point" />
            <text x={x} y="207" textAnchor="middle" className="chart-label">{shortDate(item.date)}</text>
          </g>
        ))}
      </svg>
      <div className="chart-footer">
        <span>Daily spend · {currency}</span>
        <strong>{money(data[data.length - 1].amount, currency)} latest</strong>
      </div>
    </div>
  );
}

function ServiceBreakdown({ services, currency }) {
  const top = (services || []).filter((s) => Number(s.amount) !== 0).slice(0, 7);
  const total = top.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  return (
    <div className="service-list">
      {top.length ? top.map((service, index) => {
        const amount = Number(service.amount) || 0;
        const pct = total ? Math.min((amount / total) * 100, 100) : 0;
        return (
          <div className="service-row" key={service.name}>
            <div className="rank">{String(index + 1).padStart(2, "0")}</div>
            <div className="service-main">
              <div className="service-title"><span title={service.name}>{service.name}</span><strong>{money(amount, service.currency || currency)}</strong></div>
              <div className="bar"><span style={{ width: `${pct}%` }} /></div>
            </div>
          </div>
        );
      }) : <div className="empty">No service spend recorded.</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "unknown").toLowerCase();
  const tone = ["unused", "stopped"].includes(normalized) ? "danger" : normalized === "underutilized" ? "warning" : "healthy";
  return <span className={`status ${tone}`}>{status || "unknown"}</span>;
}

function App() {
  const [page, setPage] = useState("overview");
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, resourcesResponse] = await Promise.all([
        fetch(`/api/dashboard?days=${days}`),
        fetch("/api/resources"),
      ]);
      if (!dashboardResponse.ok || !resourcesResponse.ok) throw new Error("The API could not return the application data.");
      const [dashboard, resourceData] = await Promise.all([dashboardResponse.json(), resourcesResponse.json()]);
      setData(dashboard);
      setResources(resourceData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to load CloudCostOps.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const currency = data?.currency || "USD";
  const totalServiceCost = useMemo(() => (data?.services || []).reduce((sum, item) => sum + Number(item.amount || 0), 0), [data]);
  const savingsRate = data?.total_cost ? Math.round((Number(data.potential_savings || 0) / Number(data.total_cost)) * 100) : 0;
  const forecastCost = Number(data?.total_cost || 0) * 1.08;
  const realizedSavings = Number(data?.potential_savings || 0) * 0.32;
  const efficiencyScore = Math.max(0, Math.min(100, Math.round(100 - (Number(data?.resources?.unused || 0) * 12) - (Number(data?.resources?.underutilized || 0) * 6))));

  if (loading && !data) return <div className="loading-screen"><div className="loader" /><strong>Loading CloudCostOps</strong><span>Preparing your cost intelligence workspace…</span></div>;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo"><div className="logo-mark">C</div><div><strong>CloudCostOps</strong><span>Cloud cost intelligence</span></div></div>
        <nav className="nav">
          {NAV_GROUPS.map((group) => <div className="nav-group" key={group.title || "primary"}>
            {group.title ? <span className="nav-group-title">{group.title}</span> : null}
            {group.items.map(([id, label]) => <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(["categories","dashboards","autostopping","commitments","clusters","budgets","assets","anomalies"].includes(id) ? "overview" : id)}><Icon name={id} /><span>{label}</span>{id === "recommendations" && data?.recommendations?.length ? <b>{data.recommendations.length}</b> : null}</button>)}
          </div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="mode-box"><span className="mode-dot" /><div><strong>{data?.data_source === "aws" ? "AWS connected" : "Demo environment"}</strong><span>{data?.data_source === "aws" ? "Live AWS APIs" : "Local PostgreSQL data"}</span></div></div>
          <button className="settings-link" onClick={() => setPage("settings")}><Icon name="settings" /><span>Environment</span></button>
        </div>
      </aside>

      <main className="main">\n        <div className="insight-prompts" aria-label="AI cost insight prompts"><span className="ai-orb">✦</span>{["Ask AI for Cost Insights", "What are my top spenders this month?", "How have my costs changed?", "How can I reduce cloud spend?"].map((prompt) => <button key={prompt} onClick={() => setPage("recommendations")}>{prompt}</button>)}</div>
        <header className="header">
          <div><span className="breadcrumb">CloudCostOps / {page === "overview" ? "Overview" : page[0].toUpperCase() + page.slice(1)}</span><h1>{page === "overview" ? "Cloud cost command center" : page === "costs" ? "Cost analysis" : page === "resources" ? "Resource inventory" : page === "recommendations" ? "Optimization recommendations" : "Environment"}</h1></div>
          <div className="header-actions"><label className="select-wrap"><span>Period</span><select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value="7">7 days</option><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option></select></label><button className="refresh" onClick={load} disabled={loading}><Icon name="refresh" />{loading ? "Refreshing" : "Refresh"}</button></div>
        </header>

        {error ? <div className="alert"><strong>Unable to load data</strong><span>{error}</span><button onClick={load}>Try again</button></div> : null}

        {page === "overview" && data ? <>
          <section className="hero-row"><div><span className="section-kicker">CLOUD & AI COST MANAGEMENT</span><h2>FinOps command center</h2><p>Understand cloud spend, detect anomalies, and turn optimization opportunities into measurable savings.</p></div><div className="hero-meta"><span className="live-dot" />{data.data_source === "aws" ? "AWS Cost Explorer" : "Demo data"}<small>Updated {lastUpdated?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div></section>
          <section className="stats-grid finops-stats">
            <StatCard label="TOTAL COST" value={money(data.total_cost, currency)} detail={`Last ${days} days · ${data.data_source === "aws" ? "AWS data" : "Demo data"}`} />
            <StatCard label="FORECASTED COST" value={money(forecastCost, currency)} detail="Illustrative 8% projection" />
            <StatCard label="TOTAL SAVINGS REALIZED" value={money(realizedSavings, currency)} detail="Demo estimate · not verified savings" tone="green" />
            <StatCard label="POTENTIAL SAVINGS" value={money(data.potential_savings, currency)} detail={savingsRate ? `${savingsRate}% of period spend` : "Current recommendations"} tone="green" />
            <StatCard label="CLUSTER EFFICIENCY SCORE" value={`${efficiencyScore}`} detail={`${data.resources.unused} unused · ${data.resources.underutilized} underutilized`} tone="purple" />
          </section>
          <section className="two-col">
            <article className="panel"><div className="panel-head"><div><span className="section-kicker">COST TREND AND ANOMALIES</span><h3>Cloud spend by day</h3></div><span className="period">Last {days} days</span></div><CostChart data={data.daily_costs} currency={currency} /></article>
            <article className="panel"><div className="panel-head"><div><span className="section-kicker">COST DRIVERS</span><h3>Top services</h3></div><span className="period">{money(totalServiceCost, currency)}</span></div><ServiceBreakdown services={data.services} currency={currency} /></article>
          </section>
          <section className="finops-widgets">
            <article className="panel widget-card"><div className="panel-head"><div><span className="section-kicker">COST OPTIMIZATION</span><h3>Recommendations breakdown</h3></div><span className="tag">Optimization</span></div><div className="donut-row"><div className="donut donut-green"><div><strong>{money(data.potential_savings, currency)}</strong><span>Potential savings</span></div></div><div className="legend-list"><span><i className="legend-dot green-dot" />Compute optimization</span><span><i className="legend-dot blue-dot" />Idle resources</span><span><i className="legend-dot purple-dot" />Storage & other</span></div></div><div className="widget-foot">Savings identified <strong>{money(data.potential_savings, currency)}</strong></div></article>
            <article className="panel widget-card"><div className="panel-head"><div><span className="section-kicker">CLUSTER REPORTING</span><h3>Cluster cost breakdown</h3></div><span className="tag">Reporting</span></div><div className="donut-row"><div className="donut donut-purple"><div><strong>{efficiencyScore}/100</strong><span>Efficiency score</span></div></div><div className="legend-list"><span><i className="legend-dot purple-dot" />Efficient <b>{Math.max(0, data.resources.total-data.resources.unused-data.resources.underutilized)}</b></span><span><i className="legend-dot amber-dot" />Underutilized <b>{data.resources.underutilized}</b></span><span><i className="legend-dot red-dot" />Unused <b>{data.resources.unused}</b></span></div></div></article>
            <article className="panel widget-card"><div className="panel-head"><div><span className="section-kicker">AUTOMATION</span><h3>AutoStopping</h3></div><span className="tag">Optimization</span></div><div className="big-widget-value">{money(realizedSavings, currency)}</div><p className="widget-caption">Illustrative savings estimate</p><div className="widget-foot">Active rules <strong>0 configured</strong></div></article>
            <article className="panel widget-card"><div className="panel-head"><div><span className="section-kicker">GOVERNANCE</span><h3>Asset governance</h3></div><span className="tag tag-pink">Governance</span></div><div className="big-widget-value">{data.resources.total}</div><p className="widget-caption">Resources tracked locally</p><div className="widget-foot">Recommendations <strong>{data.recommendations?.length || 0}</strong></div></article>
          </section>
          <section className="two-col lower">
            <article className="panel"><div className="panel-head"><div><span className="section-kicker">RESOURCE HEALTH</span><h3>What needs attention?</h3></div><button className="text-button" onClick={() => setPage("resources")}>View inventory →</button></div><div className="health-grid"><div><strong>{data.resources.total}</strong><span>Total resources</span></div><div className="warning-stat"><strong>{data.resources.underutilized}</strong><span>Underutilized</span></div><div className="danger-stat"><strong>{data.resources.unused}</strong><span>Unused</span></div></div></article>
            <article className="panel recommendation-highlight"><div className="panel-head"><div><span className="section-kicker">NEXT ACTIONS</span><h3>Highest-value opportunities</h3></div><button className="text-button" onClick={() => setPage("recommendations")}>View all →</button></div>{(data.recommendations || []).slice(0, 3).map((item) => <div className="mini-recommendation" key={`${item.resource}-${item.issue}`}><div><strong>{item.resource}</strong><span>{item.issue}</span></div><span>{money(item.estimated_savings, currency)}</span></div>)}</article>
          </section>
        </> : null}

        {page === "costs" && data ? <section className="page-content"><article className="panel large"><div className="panel-head"><div><span className="section-kicker">COST EXPLORER</span><h3>Spend over time</h3></div><span className="period">{days} days</span></div><CostChart data={data.daily_costs} currency={currency} /></article><article className="panel large"><div className="panel-head"><div><span className="section-kicker">SERVICE BREAKDOWN</span><h3>Where the money goes</h3></div></div><ServiceBreakdown services={data.services} currency={currency} /></article></section> : null}

        {page === "resources" && data ? <section className="page-content"><div className="resource-summary"><StatCard label="TOTAL" value={data.resources.total} detail="Discovered resources" /><StatCard label="UNUSED" value={data.resources.unused} detail="Review before deleting" tone="red" /><StatCard label="UNDERUTILIZED" value={data.resources.underutilized} detail="Review capacity" tone="amber" /></div><article className="panel large"><div className="panel-head"><div><span className="section-kicker">INVENTORY</span><h3>Cloud resources</h3></div><span className="period">{resources.length} discovered</span></div><div className="table-scroll"><table><thead><tr><th>Resource</th><th>Type</th><th>Status</th><th>Source</th></tr></thead><tbody>{resources.map((resource) => <tr key={`${resource.type}-${resource.id}`}><td><strong>{resource.id}</strong><small>{resource.details?.instance_type || resource.details?.instance_class || resource.details?.volume_type || ""}</small></td><td>{resource.type}</td><td><StatusBadge status={resource.status} /></td><td>{resource.source}</td></tr>)}</tbody></table></div></article></section> : null}

        {page === "recommendations" && data ? <section className="page-content"><div className="recommendation-banner"><div><span className="section-kicker">OPTIMIZATION POTENTIAL</span><strong>{money(data.potential_savings, currency)}</strong><p>Estimated savings currently identified. Recommendations are advisory; validate workload requirements before changing resources.</p></div><div className="score"><span>{data.recommendations?.length || 0}</span><small>opportunities</small></div></div><article className="panel large"><div className="panel-head"><div><span className="section-kicker">RECOMMENDATIONS</span><h3>Actions worth reviewing</h3></div></div>{data.recommendations?.length ? <div className="recommendations">{data.recommendations.map((item, index) => <div className="recommendation" key={`${item.resource}-${index}`}><div className="rec-index">{String(index + 1).padStart(2, "0")}</div><div className="rec-copy"><strong>{item.resource}</strong><span>{item.issue}</span><p>{item.recommendation}</p></div><div className="rec-saving"><small>Estimated savings</small><strong>{money(item.estimated_savings, currency)}</strong></div></div>)}</div> : <div className="empty">No recommendations found.</div>}</article></section> : null}

        {page === "settings" ? <section className="page-content"><article className="panel large settings-panel"><span className="section-kicker">ENVIRONMENT</span><h3>CloudCostOps configuration</h3><div className="settings-row"><span>Data source</span><strong>{data?.data_source === "aws" ? "AWS APIs" : "Demo / PostgreSQL"}</strong></div><div className="settings-row"><span>AWS region</span><strong>us-east-1</strong></div><div className="settings-row"><span>Application mode</span><strong>{data?.data_source === "aws" ? "AWS" : "Local development"}</strong></div><p className="note">AWS mode is intentionally disabled during cost-conscious development. When infrastructure is provisioned, set <code>CLOUDCOSTOPS_DATA_SOURCE=aws</code> and provide the application's AWS identity through the deployment platform.</p></article></section> : null}
      </main>
    </div>
  );
}

export default App;
