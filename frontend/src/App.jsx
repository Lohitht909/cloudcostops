import { useCallback, useEffect, useMemo, useState } from "react";

function formatCurrency(amount, currency = "USD") {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ priority }) {
  return <span className={`priority ${priority || "medium"}`}>{priority || "medium"}</span>;
}

function CostChart({ daily, currency }) {
  if (!daily?.length) return <div className="empty-state">No cost data available.</div>;
  const values = daily.map((item) => Number(item.amount) || 0);
  const max = Math.max(...values, 0.01);
  const width = 900;
  const height = 260;
  const px = 42;
  const py = 25;
  const chartWidth = width - px * 2;
  const chartHeight = height - 65;
  const points = daily.map((item, index) => {
    const x = px + (index / Math.max(daily.length - 1, 1)) * chartWidth;
    const y = py + chartHeight - (Number(item.amount) / max) * chartHeight;
    return { x, y, item };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${px},${py + chartHeight} ${line} ${px + chartWidth},${py + chartHeight}`;

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="cost-chart" role="img" aria-label="AWS daily cost chart">
        {[0, 1, 2, 3].map((row) => {
          const y = py + (chartHeight / 3) * row;
          return <line key={row} x1={px} y1={y} x2={px + chartWidth} y2={y} className="chart-grid" />;
        })}
        <polygon points={area} className="chart-area" />
        <polyline points={line} className="chart-line" fill="none" />
        {points.map((point) => (
          <g key={point.item.date}>
            <circle cx={point.x} cy={point.y} r="5" className="chart-dot" />
            <text x={point.x} y={height - 14} textAnchor="middle" className="chart-label">{formatDate(point.item.date)}</text>
          </g>
        ))}
      </svg>
      <div className="chart-summary"><span>Daily AWS spend · {currency}</span><span>Latest <strong>{formatCurrency(daily[daily.length - 1].amount, currency)}</strong></span></div>
    </div>
  );
}

function App() {
  const [days, setDays] = useState(7);
  const [dashboard, setDashboard] = useState(null);
  const [costs, setCosts] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, costsResponse, resourceResponse] = await Promise.all([
        fetch(`/api/dashboard?days=${days}`),
        fetch(`/api/costs?days=${days}`),
        fetch("/api/resources"),
      ]);
      if (!dashboardResponse.ok || !costsResponse.ok || !resourceResponse.ok) throw new Error("Unable to load CloudCostOps data");
      const [dashboardData, costsData, resourceData] = await Promise.all([
        dashboardResponse.json(),
        costsResponse.json(),
        resourceResponse.json(),
      ]);
      setDashboard(dashboardData);
      setCosts(costsData);
      setResources(resourceData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { loadData(); }, [loadData]);

  const topServices = useMemo(() => (costs?.services || []).filter((item) => Number(item.amount) !== 0).slice(0, 6), [costs]);
  const totalServiceCost = useMemo(() => (costs?.services || []).reduce((sum, item) => sum + Number(item.amount || 0), 0), [costs]);
  const currency = costs?.currency || dashboard?.currency || "USD";
  const awsAccount = dashboard?.aws_account;
  const isAws = dashboard?.data_source === "aws";
  const change = dashboard?.cost_change_percent;

  if (loading && !dashboard) {
    return <div className="app-shell"><main className="container"><header className="topbar"><div className="brand"><div className="brand-mark">C</div><div><h1>CloudCostOps</h1><p>AWS Cost Intelligence</p></div></div></header><div className="loading-page"><div className="loading-spinner" /><p>Loading AWS cost intelligence...</p></div></main></div>;
  }

  if (error && !dashboard) {
    return <div className="app-shell"><main className="container"><div className="error-page"><div className="error-icon">!</div><h1>Unable to load CloudCostOps</h1><p>{error}</p><button className="retry-button" onClick={loadData}>Retry</button></div></main></div>;
  }

  return (
    <div className="app-shell">
      <main className="container">
        <header className="topbar">
          <div className="brand"><div className="brand-mark">C</div><div><h1>CloudCostOps</h1><p>AWS Cost Intelligence</p></div></div>
          <div className="environment"><span className="status-dot" /><span>{isAws ? "AWS Live" : "Demo"}</span><span className="separator">•</span><span>{awsAccount?.region || "Local"}</span>{awsAccount?.account_id && <><span className="separator">•</span><span>Account {awsAccount.account_id}</span></>}</div>
        </header>

        <section className="hero">
          <div><p className="eyebrow">AWS COST INTELLIGENCE</p><h2>See where your AWS spend goes — and where you can save.</h2><p className="hero-description">CloudCostOps combines AWS cost data, resource inventory, CloudWatch utilization, and optimization rules into one operational view.</p></div>
          <div className="hero-controls"><label htmlFor="period">Period</label><select id="period" value={days} onChange={(event) => setDays(Number(event.target.value))}><option value="7">7 days</option><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option></select><button className="refresh-button" onClick={loadData} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button></div>
        </section>

        <section className="kpi-grid">
          <div className="kpi-card primary"><div className="kpi-header"><span>{days}-Day AWS Spend</span><span className="kpi-icon">$</span></div><strong>{formatCurrency(costs?.total, currency)}</strong><p>{isAws ? "Live AWS Cost Explorer" : "Local demo data"}</p></div>
          <div className="kpi-card"><div className="kpi-header"><span>Previous Period</span><span className="kpi-icon">↗</span></div><strong>{dashboard?.previous_month_cost == null ? "—" : formatCurrency(dashboard.previous_month_cost, currency)}</strong><p>{change == null ? "No comparable baseline" : `${change > 0 ? "+" : ""}${change}% vs previous period`}</p></div>
          <div className="kpi-card savings"><div className="kpi-header"><span>Potential Savings</span><span className="kpi-icon">✦</span></div><strong>{formatCurrency(dashboard?.potential_savings, currency)}</strong><p>{isAws ? "Only defensible estimates" : "Demo recommendations"}</p></div>
          <div className="kpi-card"><div className="kpi-header"><span>AWS Resources</span><span className="kpi-icon">◌</span></div><strong>{dashboard?.resources?.total || 0}</strong><p>{dashboard?.resources?.unused || 0} unused · {dashboard?.resources?.underutilized || 0} underutilized</p></div>
        </section>

        <section className="content-grid">
          <div className="panel chart-panel"><div className="panel-header"><div><p className="panel-eyebrow">SPEND TREND</p><h3>Daily AWS Cost</h3></div><span className="period-badge">Last {days} days</span></div><CostChart daily={costs?.daily} currency={currency} /></div>
          <div className="panel services-panel"><div className="panel-header"><div><p className="panel-eyebrow">COST BREAKDOWN</p><h3>Top AWS Services</h3></div></div><div className="service-total"><span>Service spend</span><strong>{formatCurrency(totalServiceCost, currency)}</strong></div><div className="service-list">{topServices.length ? topServices.map((service, index) => { const amount = Number(service.amount) || 0; const pct = totalServiceCost ? Math.abs(amount / totalServiceCost) * 100 : 0; return <div className="service-row" key={service.name}><div className="service-info"><div className="service-rank">{String(index + 1).padStart(2, "0")}</div><div className="service-name"><span>{service.name}</span><div className="service-bar"><div className="service-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} /></div></div><strong>{formatCurrency(amount, service.currency || currency)}</strong></div></div>; }) : <div className="empty-state">No service cost data.</div>}</div></div>
        </section>

        <section className="panel"><div className="panel-header"><div><p className="panel-eyebrow">AWS RESOURCES</p><h3>Resource Inventory</h3></div><span className="period-badge">{resources.length} resources</span></div><div className="table-wrapper"><table><thead><tr><th>Resource</th><th>Type</th><th>Status</th><th>Source</th><th>Details</th></tr></thead><tbody>{resources.length ? resources.map((resource) => <tr key={`${resource.type}-${resource.id}`}><td><strong>{resource.id}</strong></td><td>{resource.type}</td><td><span className={`resource-status ${String(resource.status).toLowerCase()}`}>{resource.status}</span></td><td>{resource.source}</td><td>{resource.details?.avg_cpu_percent != null ? `${resource.details.avg_cpu_percent}% avg CPU` : resource.details?.instance_type || resource.details?.size_gb ? `${resource.details.instance_type || `${resource.details.size_gb} GB ${resource.details.volume_type || ""}`}` : "—"}</td></tr>) : <tr><td colSpan="5"><div className="empty-state">No AWS resources found.</div></td></tr>}</tbody></table></div></section>

        <section className="content-grid resource-grid"><div className="panel"><div className="panel-header"><div><p className="panel-eyebrow">RESOURCE HEALTH</p><h3>Inventory Summary</h3></div></div><div className="resource-stats"><div className="resource-stat"><span>Total</span><strong>{dashboard?.resources?.total || 0}</strong></div><div className="resource-stat warning"><span>Unused</span><strong>{dashboard?.resources?.unused || 0}</strong></div><div className="resource-stat"><span>Underutilized</span><strong>{dashboard?.resources?.underutilized || 0}</strong></div></div></div><div className="panel savings-panel"><p className="panel-eyebrow">AWS ACCOUNT</p><div className="savings-number">{awsAccount?.account_id || "Demo"}</div><p>{isAws ? `Live account · ${awsAccount.region}` : "No AWS account connected in local demo mode."}</p></div></section>

        <section className="panel recommendations-panel"><div className="panel-header"><div><p className="panel-eyebrow">OPTIMIZATION ENGINE</p><h3>Recommendations</h3></div><span className="recommendation-count">{dashboard?.recommendations?.length || 0} opportunities</span></div><div className="recommendation-list">{dashboard?.recommendations?.length ? dashboard.recommendations.map((item, index) => <div className="recommendation" key={`${item.resource}-${index}`}><div className="recommendation-number">{String(index + 1).padStart(2, "0")}</div><div className="recommendation-main"><strong>{item.resource}</strong><span className="issue">{item.issue}</span><p>{item.recommendation}</p><StatusBadge priority={item.priority} /></div><div className="recommendation-savings"><span>Estimated savings</span><strong>{item.estimated_savings > 0 ? formatCurrency(item.estimated_savings, currency) : "—"}</strong><small>{item.savings_status === "requires_pricing_or_usage_data" ? "Needs pricing data" : "/ month"}</small></div></div>) : <div className="empty-state">No optimization findings for the current inventory.</div>}</div></section>

        <section className="panel"><div className="panel-header"><div><p className="panel-eyebrow">COST EXPLORER</p><h3>Daily Cost Details</h3></div></div><div className="table-wrapper"><table><thead><tr><th>Date</th><th>Daily Cost</th><th>Data</th></tr></thead><tbody>{costs?.daily?.map((day) => <tr key={day.date}><td><strong>{formatDate(day.date)}</strong><span className="date-full">{day.date}</span></td><td className="money-cell">{formatCurrency(day.amount, day.currency || currency)}</td><td><span className={`badge ${day.estimated ? "estimated" : "actual"}`}>{day.estimated ? "Estimated" : "Final"}</span></td></tr>)}</tbody></table></div></section>

        <footer><span>CloudCostOps</span><span>•</span><span>AWS Cost Intelligence Platform</span><span>•</span><span>{isAws ? `Live AWS account ${awsAccount?.account_id || ""}` : "Local demo mode"}</span></footer>
      </main>
    </div>
  );
}

export default App;
