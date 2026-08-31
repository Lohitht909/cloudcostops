import { useEffect, useState } from "react";

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
          throw new Error("Failed to load dashboard");
        }

        if (!costsResponse.ok) {
          throw new Error("Failed to load AWS costs");
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
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="container">
        <h1>CloudCostOps</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!dashboard || !costs) {
    return (
      <div className="container">
        <h1>CloudCostOps</h1>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <div>
          <h1>CloudCostOps</h1>
          <p>AWS Cloud Cost Optimization Dashboard</p>
        </div>
      </header>

      <section className="cards">
        <div className="card">
          <span>AWS Cost — Last 7 Days</span>
          <strong>
            ${costs.total.toFixed(2)}
          </strong>
        </div>

        <div className="card">
          <span>Previous Month</span>
          <strong>
            ${dashboard.previous_month_cost.toFixed(2)}
          </strong>
        </div>

        <div className="card">
          <span>Potential Savings</span>
          <strong>
            ${dashboard.potential_savings.toFixed(2)}
          </strong>
        </div>

        <div className="card">
          <span>Unused Resources</span>
          <strong>
            {dashboard.resources.unused}
          </strong>
        </div>
      </section>

      <section className="panel">
        <h2>AWS Cost by Service — Last 7 Days</h2>

        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Cost</th>
            </tr>
          </thead>

          <tbody>
            {costs.services.map((service) => (
              <tr key={service.name}>
                <td>{service.name}</td>
                <td>
                  ${service.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Daily AWS Cost — Last 7 Days</h2>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Cost</th>
              <th>Estimated</th>
            </tr>
          </thead>

          <tbody>
            {costs.daily.map((day) => (
              <tr key={day.date}>
                <td>{day.date}</td>
                <td>${day.amount.toFixed(2)}</td>
                <td>{day.estimated ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Optimization Recommendations</h2>

        {dashboard.recommendations.map((item, index) => (
          <div className="recommendation" key={index}>
            <div>
              <strong>{item.resource}</strong>
              <p>{item.issue}</p>
              <p>{item.recommendation}</p>
            </div>

            <strong>
              Save ${item.estimated_savings.toFixed(2)}
            </strong>
          </div>
        ))}
      </section>
    </div>
  );
}

export default App;