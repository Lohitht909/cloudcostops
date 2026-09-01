import { useCallback, useEffect, useMemo, useState } from "react";

const NAV_ITEMS = [
  ["overview", "Overview"],
  ["costs", "Costs"],
  ["resources", "Resources"],
  ["recommendations", "Recommendations"],
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

  if (loading && !data) return <div className="loading-screen"><div className="loader" /><strong>Loading CloudCostOps</strong><span>Preparing your cost intelligence workspace…</span></div>;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo"><div className="logo-mark">C</div><div><strong>CloudCostOps</strong><span>Cloud cost intelligence</span></div></div>
        <nav className="nav">
          {NAV_ITEMS.map(([id, label]) => (
            <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}><Icon name={id} /><span>{label}</span>{id === "recommendations" && data?.recommendations?.length ? <b>{data.recommendations.length}</b> : null}</button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mode-box"><span className="mode-dot" /><div><strong>{data?.data_source === "aws" ? "AWS connected" : "Demo environment"}</strong><span>{data?.data_source === "aws" ? "Live AWS APIs" : "Local PostgreSQL data"}</span></div></div>
          <button className="settings-link" onClick={() => setPage("settings")}><Icon name="settings" /><span>Environment</span></button>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div><span className="breadcrumb">CloudCostOps / {page === "overview" ? "Overview" : page[0].toUpperCase() + page.slice(1)}</span><h1>{page === "overview" ? "Cloud cost command center" : page === "costs" ? "Cost analysis" : page === "resources" ? "Resource inventory" : page === "recommendations" ? "Optimization recommendations" : "Environment"}</h1></div>
          <div className="header-actions"><label className="select-wrap"><span>Period</span><select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value="7">7 days</option><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option></select></label><button className="refresh" onClick={load} disabled={loading}><Icon name="refresh" />{loading ? "Refreshing" : "Refresh"}</button></div>
        </header>

        {error ? <div className="alert"><strong>Unable to load data</strong><span>{error}</span><button onClick={load}>Try again</button></div> : null}

        {page === "overview" && data ? <>
          <section className="hero-row"><div><span className="section-kicker">FINOPS OVERVIEW</span><h2>See what your cloud is costing you.</h2><p>Track spend, understand service drivers, find idle infrastructure and turn waste into measurable savings.</p></div><div className="hero-meta"><span className="live-dot" />{data.data_source === "aws" ? "AWS Cost Explorer" : "Demo data"}<small>Updated {lastUpdated?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div></section>
          <section className="stats-grid">
            <StatCard label={`${days}-DAY SPEND`} value={money(data.total_cost, currency)} detail={data.data_source === "aws" ? "AWS Cost Explorer" : "Seeded development data"} tone="dark" />
            <StatCard label="POTENTIAL SAVINGS" value={money(data.potential_savings, currency)} detail={savingsRate ? `${savingsRate}% of period spend` : "From current recommendations"} tone="green" />
            <StatCard label="RESOURCES" value={data.resources.total} detail={`${data.resources.unused} unused · ${data.resources.underutilized} underutilized`} />
            <StatCard label="TOP SERVICE" value={data.services?.[0]?.name || "—"} detail={data.services?.[0] ? money(data.services[0].amount, currency) : "No data"} />
          </section>
          <section className="two-col">
            <article className="panel"><div className="panel-head"><div><span className="section-kicker">SPEND TREND</span><h3>Daily cost</h3></div><span className="period">Last {days} days</span></div><CostChart data={data.daily_costs} currency={currency} /></article>
            <article className="panel"><div className="panel-head"><div><span className="section-kicker">COST DRIVERS</span><h3>Top services</h3></div><span className="period">{money(totalServiceCost, currency)}</span></div><ServiceBreakdown services={data.services} currency={currency} /></article>
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
