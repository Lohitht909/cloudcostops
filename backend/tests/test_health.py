from unittest.mock import patch

import pytest
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
    mock_dashboard = {
        "currency": "USD",
        "days": 7,
        "total_cost": 28.01,
        "daily_costs": [
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
        ],
        "services": [
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
        ],
    }

    with patch(
        "app.routes.dashboard.build_dashboard",
        return_value=mock_dashboard,
    ):
        response = client.get("/api/dashboard")

    assert response.status_code == 200
    assert response.json() == mock_dashboard


def test_dashboard_days_parameter():
    mock_dashboard = {
        "currency": "USD",
        "days": 30,
        "total_cost": 100.00,
        "daily_costs": [],
        "services": [],
    }

    with patch(
        "app.routes.dashboard.build_dashboard",
        return_value=mock_dashboard,
    ) as build_dashboard:
        response = client.get("/api/dashboard?days=30")

    assert response.status_code == 200
    assert response.json() == mock_dashboard
    build_dashboard.assert_called_once_with(30)


def test_dashboard_rejects_invalid_days():
    response = client.get("/api/dashboard?days=0")
    assert response.status_code == 422

    response = client.get("/api/dashboard?days=91")
    assert response.status_code == 422


def test_costs():
    mock_dashboard = {
        "currency": "USD",
        "days": 7,
        "total_cost": 28.01,
        "daily_costs": [
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
        ],
        "services": [
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
        ],
    }

    with patch(
        "app.routes.dashboard.build_dashboard",
        return_value=mock_dashboard,
    ):
        response = client.get("/api/costs")

    assert response.status_code == 200

    data = response.json()

    assert data["currency"] == "USD"
    assert data["days"] == 7
    assert data["total"] == pytest.approx(28.01)
    assert data["daily"] == mock_dashboard["daily_costs"]
    assert data["services"] == mock_dashboard["services"]


def test_resources():
    response = client.get("/api/resources")

    assert response.status_code == 200
    assert response.json() == {
        "total": 0,
        "unused": 0,
        "underutilized": 0,
    }


def test_recommendations():
    response = client.get("/api/recommendations")

    assert response.status_code == 200
    assert response.json() == []
