from fastapi.testclient import TestClient
import pytest

from app.main import app

from unittest.mock import patch

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
    mock_daily_costs = [
        {
            "date": "2026-08-30",
            "amount": 12.34,
            "currency": "USD",
            "estimated": True,
        },
        {
            "date": "2026-08-31",
            "amount": 15.67,
            "currency": "USD",
            "estimated": True,
        },
    ]

    mock_service_costs = [
        {
            "name": "Amazon Elastic Compute Cloud",
            "amount": 20.00,
            "currency": "USD",
        },
        {
            "name": "Amazon Elastic Kubernetes Service",
            "amount": 8.01,
            "currency": "USD",
        },
    ]

    with patch(
        "app.routes.dashboard.get_daily_costs",
        return_value=mock_daily_costs,
    ), patch(
        "app.routes.dashboard.get_service_costs",
        return_value=mock_service_costs,
    ):
        response = client.get("/api/costs")

    assert response.status_code == 200

    data = response.json()

    assert data["currency"] == "USD"
    assert data["days"] == 7

    assert data["total"] == pytest.approx(28.01)

    assert data["daily"] == mock_daily_costs
    assert data["services"] == mock_service_costs

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
