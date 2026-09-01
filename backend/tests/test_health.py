from unittest.mock import ANY, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "cloudcostops-backend"
    assert "version" in data
    assert data["data_source"] in {"demo", "aws"}


def test_dashboard():
    mock_dashboard = {
        "currency": "USD",
        "days": 7,
        "total_cost": 28.01,
        "daily_costs": [],
        "services": [],
        "resources": {"total": 0, "unused": 0, "underutilized": 0},
        "recommendations": [],
        "potential_savings": 0.0,
        "previous_month_cost": 28.01,
        "data_source": "demo",
    }

    with patch(
        "app.routes.dashboard.build_dashboard",
        return_value=mock_dashboard,
    ) as build_dashboard:
        response = client.get("/api/dashboard")

    assert response.status_code == 200
    assert response.json() == mock_dashboard
    build_dashboard.assert_called_once_with(ANY, 7)


def test_dashboard_days_parameter():
    mock_dashboard = {
        "currency": "USD",
        "days": 30,
        "total_cost": 100.00,
        "daily_costs": [],
        "services": [],
        "resources": {"total": 0, "unused": 0, "underutilized": 0},
        "recommendations": [],
        "potential_savings": 0.0,
        "previous_month_cost": 100.00,
        "data_source": "demo",
    }

    with patch(
        "app.routes.dashboard.build_dashboard",
        return_value=mock_dashboard,
    ) as build_dashboard:
        response = client.get("/api/dashboard?days=30")

    assert response.status_code == 200
    assert response.json() == mock_dashboard
    build_dashboard.assert_called_once_with(ANY, 30)


def test_dashboard_rejects_invalid_days():
    assert client.get("/api/dashboard?days=0").status_code == 422
    assert client.get("/api/dashboard?days=91").status_code == 422


def test_costs():
    mock_dashboard = {
        "currency": "USD",
        "days": 7,
        "total_cost": 28.01,
        "daily_costs": [],
        "services": [],
        "resources": {"total": 0, "unused": 0, "underutilized": 0},
        "recommendations": [],
        "potential_savings": 0.0,
        "previous_month_cost": 28.01,
        "cost_change_percent": None,
        "data_source": "demo",
    }

    with patch("app.routes.dashboard.build_dashboard", return_value=mock_dashboard):
        response = client.get("/api/costs")

    assert response.status_code == 200
    data = response.json()
    assert data["currency"] == "USD"
    assert data["days"] == 7
    assert data["total"] == pytest.approx(28.01)
    assert data["data_source"] == "demo"


def test_resources():
    resources = [
        {"id": "i-demo", "type": "EC2", "status": "underutilized", "source": "demo"},
        {"id": "vol-demo", "type": "EBS", "status": "unused", "source": "demo"},
    ]

    with patch("app.routes.dashboard.list_resources", return_value=resources):
        response = client.get("/api/resources")

    assert response.status_code == 200
    assert response.json() == resources


def test_resource_summary():
    resources = [
        {"id": "i-demo", "type": "EC2", "status": "underutilized", "source": "demo"},
        {"id": "vol-demo", "type": "EBS", "status": "unused", "source": "demo"},
        {"id": "rds-demo", "type": "RDS", "status": "active", "source": "demo"},
    ]

    with patch("app.routes.dashboard.list_resources", return_value=resources):
        response = client.get("/api/resources/summary")

    assert response.status_code == 200
    assert response.json() == {
        "total": 3,
        "unused": 1,
        "underutilized": 1,
        "by_type": {"EC2": 1, "EBS": 1, "RDS": 1},
    }


def test_recommendations():
    recommendations = [
        {
            "resource": "EC2 i-012345",
            "issue": "Low CPU utilization",
            "recommendation": "Downsize instance",
            "estimated_savings": 48.0,
        }
    ]

    with patch(
        "app.routes.dashboard.build_dashboard",
        return_value={"recommendations": recommendations},
    ):
        response = client.get("/api/recommendations")

    assert response.status_code == 200
    assert response.json() == recommendations
