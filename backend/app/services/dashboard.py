from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Cost, Recommendation
from app.services.aws_account import get_account_context
from app.services.aws_metrics import enrich_utilization
from app.services.cost_explorer import get_cost_summary, get_daily_costs, get_service_costs
from app.services.recommendation_engine import generate_recommendations
from app.services.resource_inventory import list_resources, summarize_resources


def _demo_daily_costs(db: Session, days: int):
    costs = db.query(Cost).order_by(Cost.id).all()
    total = round(sum(item.cost for item in costs), 2)
    if days <= 0:
        return []
    daily_amount = round(total / days, 2)
    result = []
    running = 0.0
    for offset in range(days):
        amount = daily_amount
        if offset == days - 1:
            amount = round(total - running, 2)
        running += amount
        result.append({
            "date": (date.today() - timedelta(days=days - 1 - offset)).isoformat(),
            "amount": amount,
            "currency": "USD",
            "estimated": True,
        })
    return result


def build_dashboard(db: Session, days: int = 7):
    resources = list_resources(db)

    if settings.data_source == "aws":
        resources = enrich_utilization(resources, days)
        daily = get_daily_costs(days)
        services = get_service_costs(days)
        cost_summary = get_cost_summary(days)
        recommendations = generate_recommendations(resources)
        total_cost = cost_summary["current"]
        previous_cost = cost_summary["previous"]
        cost_change_percent = cost_summary["change_percent"]
        data_source = "aws"
        account = get_account_context()
    else:
        daily = _demo_daily_costs(db, days)
        costs = db.query(Cost).order_by(Cost.id).all()
        services = [
            {"name": item.service, "amount": round(item.cost, 2), "currency": "USD"}
            for item in costs
        ]
        services.sort(key=lambda item: item["amount"], reverse=True)
        demo_recommendations = db.query(Recommendation).order_by(
            Recommendation.estimated_savings.desc()
        ).all()
        recommendations = [
            {
                "resource": item.resource,
                "issue": item.issue,
                "recommendation": item.recommendation,
                "estimated_savings": round(item.estimated_savings, 2),
                "priority": "medium",
                "savings_status": "demo",
                "source": "demo",
            }
            for item in demo_recommendations
        ]
        total_cost = round(sum(item["amount"] for item in daily), 2)
        previous_cost = None
        cost_change_percent = None
        data_source = "demo"
        account = None

    resource_summary = summarize_resources(resources)
    potential_savings = round(
        sum(item["estimated_savings"] for item in recommendations), 2
    )

    return {
        "currency": daily[0]["currency"] if daily else "USD",
        "days": days,
        "total_cost": total_cost,
        "previous_month_cost": previous_cost,
        "cost_change_percent": cost_change_percent,
        "potential_savings": potential_savings,
        "daily_costs": daily,
        "services": services,
        "resources": resource_summary,
        "resource_details": resources,
        "recommendations": recommendations,
        "data_source": data_source,
        "aws_account": account,
    }
