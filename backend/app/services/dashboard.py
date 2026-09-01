from sqlalchemy.orm import Session

from app.config import settings
from app.services.cost_explorer import get_daily_costs, get_service_costs
from app.services.demo_dashboard import build_demo_dashboard
from app.services.recommendation_engine import generate_recommendations
from app.services.resource_inventory import list_resources, summarize_resources


def build_dashboard(db: Session, days: int = 7):
    if settings.data_source == "aws":
        daily = get_daily_costs(days)
        services = get_service_costs(days)
        resources = list_resources(db)
        recommendations = generate_recommendations(resources)

        total_cost = round(sum(item["amount"] for item in daily), 2)
        potential_savings = round(
            sum(item["estimated_savings"] for item in recommendations), 2
        )

        return {
            "currency": daily[0]["currency"] if daily else "USD",
            "days": days,
            "total_cost": total_cost,
            "previous_month_cost": None,
            "potential_savings": potential_savings,
            "daily_costs": daily,
            "services": services,
            "resources": summarize_resources(resources),
            "recommendations": recommendations,
            "data_source": "aws",
        }

    return build_demo_dashboard(db, days)
