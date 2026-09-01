from sqlalchemy.orm import Session

from app.config import settings
from app.services.cost_explorer import get_daily_costs, get_service_costs
from app.services.demo_dashboard import build_demo_dashboard


def build_dashboard(db: Session, days: int = 7):
    if settings.data_source == "aws":
        daily = get_daily_costs(days)
        services = get_service_costs(days)

        total_cost = round(sum(item["amount"] for item in daily), 2)

        return {
            "currency": daily[0]["currency"] if daily else "USD",
            "days": days,
            "total_cost": total_cost,
            "previous_month_cost": None,
            "potential_savings": 0.0,
            "daily_costs": daily,
            "services": services,
            "resources": {
                "total": 0,
                "unused": 0,
                "underutilized": 0,
            },
            "recommendations": [],
            "data_source": "aws",
        }

    return build_demo_dashboard(db, days)
