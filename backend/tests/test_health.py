from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "cloudcostops-backend",
    }


def test_dashboard():
    response = client.get("/api/dashboard")

    assert response.status_code == 200

    data = response.json()

    assert "monthly_cost" in data
    assert "previous_month_cost" in data
    assert "potential_savings" in data
    assert "services" in data
    assert "resources" in data
    assert "recommendations" in data


def test_costs():
    response = client.get("/api/costs")

    assert response.status_code == 200

    data = response.json()

    assert len(data) > 0
    assert all("name" in service for service in data)
    assert all("cost" in service for service in data)


def test_resources():
    response = client.get("/api/resources")

    assert response.status_code == 200

    data = response.json()

    assert "total" in data
    assert "unused" in data
    assert "underutilized" in data


def test_recommendations():
    response = client.get("/api/recommendations")

    assert response.status_code == 200

    data = response.json()

    assert len(data) > 0
    assert all("resource" in recommendation for recommendation in data)
    assert all("recommendation" in recommendation for recommendation in data)
    assert all("estimated_savings" in recommendation for recommendation in data)
