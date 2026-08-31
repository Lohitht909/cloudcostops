import { useEffect, useMemo, useState } from "react";

function formatCurrency(amount, currency = "USD") {
  const value = Number(amount) || 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function CostChart({ daily, currency }) {
  if (!daily || daily.length === 0) {
    return <div className="empty-state">No daily cost data available.</div>;
  }

  const values = daily.map((item) => Number(item.amount) || 0);

  const maxValue = Math.max(...values.map(Math.abs), 0.01);

  const width = 900;
  const height = 280;
  const paddingX = 45;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = daily.map((item, index) => {
    const x =
      paddingX +
      (index / Math.max(daily.length - 1, 1)) * chartWidth;

    const normalized = Math.abs(Number(item.amount) || 0) / maxValue;

    const y =
      paddingTop +
      chartHeight -
      normalized * chartHeight;

    return {
      x,
      y,
      item,
    };
  });

  const linePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const areaPoints = [
    `${paddingX},${paddingTop + chartHeight}`,
    ...points.map((point) => `${point.x},${point.y}`),
    `${paddingX + chartWidth},${paddingTop + chartHeight}`,
  ].join(" ");

  return (
    <div className="chart-wrapper">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="cost-chart"
        role="img"
        aria-label="AWS daily cost chart"
      >
        {[0, 1, 2, 3].map((line) => {
          const y = paddingTop + (chartHeight / 3) * line;

          return (
            <line
              key={line}
              x1={paddingX}
              y1={y}
              x2={paddingX + chartWidth}
              y2={y}
              className="chart-grid"
            />
          );
        })}

        <polygon
          points={areaPoints}
          className="chart-area"
        />

        <polyline
          points={linePoints}
          fill="none"
          className="chart-line"
        />

        {points.map((point) => (
          <g key={point.item.date}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              className="chart-dot"
            />

            <text
              x={point.x}
              y={height - 15}
              textAnchor="middle"
              className="chart-label"
            >
              {formatDate(point.item.date)}
            </text>
          </g>
        ))}
      </svg>

      <div className="chart-summary">
        <span>
          Daily AWS spend · {currency}
        </span>

        <span>
          Latest:{" "}
          <strong>
            {formatCurrency(
              daily[daily.length - 1].amount,
              currency
            )}
          </strong>
        </span>
      </div>
    </div>
  );
}

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [costs, setCosts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard"),
      fetch("/api/costs"),
    ])
      .then(async ([dashboardResponse, costsResponse]) => {
        if (!dashboardResponse.ok) {
          throw new Error("Failed to load dashboard data");
        }

        if (!costsResponse.ok) {
          throw new Error("Failed to load AWS cost data");
        }

        const dashboardData = await dashboardResponse.json();
        const costsData = await costsResponse.json();

        return {
          dashboardData,
          costsData,
        };
      })
      .then(({ dashboardData, costsData }) => {
        setDashboard(dashboardData);
        setCosts(costsData);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  const topServices = useMemo(() => {
    if (!costs?.services) {
      return [];
    }

    return costs.services
      .filter((service) => Number(service.amount) !== 0)
      .slice(0, 6);
  }, [costs]);

  const totalServiceCost = useMemo(() => {
    if (!costs?.services) {
      return 0;
    }

    return costs.services.reduce(
      (sum, service) => sum + Number(service.amount || 0),
      0
    );
  }, [costs]);

  if (error) {
    return (
      <div className="app-shell">
        <main className="container">
          <div className="error-page">
            <div className="error-icon">!</div>
            <h1>Unable to load CloudCostOps</h1>
            <p>{error}</p>
            <button
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!dashboard || !costs) {
    return (
      <div className="app-shell">
        <main className="container">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">C</div>
              <div>
                <h1>CloudCostOps</h1>
                <p>AWS Cost Intelligence</p>
              </div>
            </div>
          </header>

          <div className="loading-page">
            <div className="loading-spinner" />
            <p>Loading AWS cost data...</p>
          </div>
        </main>
      </div>
    );
  }

  const currency = costs.currency || "USD";

  return (
    <div className="app-shell">
      <main className="container">

        {/* Header */}
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">C</div>

            <div>
              <h1>CloudCostOps</h1>
              <p>AWS Cost Intelligence</p>
            </div>
          </div>

          <div className="environment">
            <span className="status-dot" />
            <span>Live</span>
            <span className="separator">•</span>
            <span>us-east-1</span>
          </div>
        </header>

        {/* Hero */}
        <section className="hero">
          <div>
            <p className="eyebrow">CLOUD COST OVERVIEW</p>
            <h2>Understand where your AWS money goes.</h2>
            <p className="hero-description">
              Monitor your cloud spend, identify expensive services,
              and uncover opportunities to optimize your infrastructure.
            </p>
          </div>

          <div className="data-source">
            <span className="source-dot" />
            AWS Cost Explorer
          </div>
        </section>

        {/* KPI Cards */}
        <section className="kpi-grid">

          <div className="kpi-card primary">
            <div className="kpi-header">
              <span>7-Day AWS Spend</span>
              <span className="kpi-icon">$</span>
            </div>

            <strong>
              {formatCurrency(costs.total, currency)}
            </strong>

            <p>
              Estimated Cost Explorer spend
            </p>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span>Previous Month</span>
              <span className="kpi-icon">↗</span>
            </div>

            <strong>
              {formatCurrency(
                dashboard.previous_month_cost,
                currency
              )}
            </strong>

            <p>
              Previous monthly baseline
            </p>
          </div>

          <div className="kpi-card savings">
            <div className="kpi-header">
              <span>Potential Savings</span>
              <span className="kpi-icon">✦</span>
            </div>

            <strong>
              {formatCurrency(
                dashboard.potential_savings,
                currency
              )}
            </strong>

            <p>
              Optimization opportunities
            </p>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span>Unused Resources</span>
              <span className="kpi-icon">◌</span>
            </div>

            <strong>
              {dashboard.resources.unused}
            </strong>

            <p>
              Of {dashboard.resources.total} resources
            </p>
          </div>

        </section>

        {/* Charts */}
        <section className="content-grid">

          <div className="panel chart-panel">
            <div className="panel-header">
              <div>
                <p className="panel-eyebrow">SPEND TREND</p>
                <h3>Daily AWS Cost</h3>
              </div>

              <span className="period-badge">
                Last 7 days
              </span>
            </div>

            <CostChart
              daily={costs.daily}
              currency={currency}
            />
          </div>

          {/* Service Costs */}
          <div className="panel services-panel">
            <div className="panel-header">
              <div>
                <p className="panel-eyebrow">COST BREAKDOWN</p>
                <h3>Top Services</h3>
              </div>

              <span className="period-badge">
                {currency}
              </span>
            </div>

            <div className="service-total">
              <span>Net service cost</span>
              <strong>
                {formatCurrency(totalServiceCost, currency)}
              </strong>
            </div>

            <div className="service-list">
              {topServices.length > 0 ? (
                topServices.map((service, index) => {
                  const amount = Number(service.amount) || 0;
                  const percentage =
                    Math.abs(totalServiceCost) > 0
                      ? Math.min(
                          Math.abs(amount / totalServiceCost) * 100,
                          100
                        )
                      : 0;

                  return (
                    <div
                      className="service-row"
                      key={service.name}
                    >
                      <div className="service-info">
                        <div className="service-rank">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="service-name">
                          <span>{service.name}</span>

                          <div className="service-bar">
                            <div
                              className="service-bar-fill"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>

                        <strong>
                          {formatCurrency(
                            amount,
                            service.currency || currency
                          )}
                        </strong>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  No billable services found for this period.
                </div>
              )}
            </div>
          </div>

        </section>

        {/* Daily Details */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">COST EXPLORER</p>
              <h3>Daily Cost Details</h3>
            </div>

            <span className="period-badge">
              {costs.days} days
            </span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Daily Cost</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {costs.daily.map((day) => (
                  <tr key={day.date}>
                    <td>
                      <strong>
                        {formatDate(day.date)}
                      </strong>
                      <span className="date-full">
                        {day.date}
                      </span>
                    </td>

                    <td className="money-cell">
                      {formatCurrency(
                        day.amount,
                        day.currency || currency
                      )}
                    </td>

                    <td>
                      {day.estimated ? (
                        <span className="badge estimated">
                          Estimated
                        </span>
                      ) : (
                        <span className="badge actual">
                          Final
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Resources */}
        <section className="content-grid resource-grid">

          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-eyebrow">RESOURCE HEALTH</p>
                <h3>Resource Overview</h3>
              </div>
            </div>

            <div className="resource-stats">

              <div className="resource-stat">
                <span>Total Resources</span>
                <strong>
                  {dashboard.resources.total}
                </strong>
              </div>

              <div className="resource-stat warning">
                <span>Unused</span>
                <strong>
                  {dashboard.resources.unused}
                </strong>
              </div>

              <div className="resource-stat">
                <span>Underutilized</span>
                <strong>
                  {dashboard.resources.underutilized}
                </strong>
              </div>

            </div>
          </div>

          <div className="panel savings-panel">
            <p className="panel-eyebrow">OPTIMIZATION POTENTIAL</p>

            <div className="savings-number">
              {formatCurrency(
                dashboard.potential_savings,
                currency
              )}
            </div>

            <p>
              Estimated savings identified from current
              optimization recommendations.
            </p>

            <div className="savings-line">
              <span />
            </div>
          </div>

        </section>

        {/* Recommendations */}
        <section className="panel recommendations-panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">OPTIMIZATION ENGINE</p>
              <h3>Recommendations</h3>
            </div>

            <span className="recommendation-count">
              {dashboard.recommendations.length} opportunities
            </span>
          </div>

          <div className="recommendation-list">
            {dashboard.recommendations.map((item, index) => (
              <div
                className="recommendation"
                key={`${item.resource}-${index}`}
              >
                <div className="recommendation-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="recommendation-main">
                  <strong>{item.resource}</strong>

                  <span className="issue">
                    {item.issue}
                  </span>

                  <p>
                    {item.recommendation}
                  </p>
                </div>

                <div className="recommendation-savings">
                  <span>Estimated savings</span>
                  <strong>
                    {formatCurrency(
                      item.estimated_savings,
                      currency
                    )}
                  </strong>
                  <small>/ month</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer>
          <span>CloudCostOps</span>
          <span>•</span>
          <span>AWS Cost Intelligence Platform</span>
          <span>•</span>
          <span>Live data from AWS Cost Explorer</span>
        </footer>

      </main>
    </div>
  );
}

export default App;