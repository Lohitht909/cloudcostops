import { useEffect, useState } from "react";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load dashboard");
        }
        return response.json();
      })
      .then((data) => setDashboard(data))
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

  if (!dashboard) {
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
          <span>Monthly Cost</span>
          <strong>${dashboard.monthly_cost.toFixed(2)}</strong>
        </div>

        <div className="card">
          <span>Previous Month</span>
          <strong>${dashboard.previous_month_cost.toFixed(2)}</strong>
        </div>

        <div className="card">
          <span>Potential Savings</span>
          <strong>${dashboard.potential_savings.toFixed(2)}</strong>
        </div>

        <div className="card">
          <span>Unused Resources</span>
          <strong>{dashboard.resources.unused}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>AWS Cost by Service</h2>

        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Monthly Cost</th>
            </tr>
          </thead>

          <tbody>
            {dashboard.services.map((service) => (
              <tr key={service.name}>
                <td>{service.name}</td>
                <td>${service.cost.toFixed(2)}</td>
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