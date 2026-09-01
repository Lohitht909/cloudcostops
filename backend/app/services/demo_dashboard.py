from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models import Cost, Recommendation, Resource


def build_demo_dashboard(db: Session, days: int = 7):
    costs = db.query(Cost).order_by(Cost.id).all()
    resources = db.query(Resource).order_by(Resource.id).all()
    recommendations = (
        db.query(Recommendation)
        .order_by(Recommendation.estimated_savings.desc())
        .all()
    )

    total_cost = round(sum(item.cost for item in costs), 2)

    # Demo-only daily distribution. Real AWS mode uses Cost Explorer's daily data.
    daily_costs = []
    if days > 0:
        daily_amount = round(total_cost / days, 2)
        running = 0.0
        for offset in range(days):
            amount = daily_amount
            if offset == days - 1:
                amount = round(total_cost - running, 2)
            running += amount
            daily_costs.append(
                {
                    "date": (date.today() - timedelta(days=days - 1 - offset)).isoformat(),
                    "amount": amount,
                    "currency": "USD",
                    "estimated": True,
                }
            )

    service_costs = [
        {
            "name": item.service,
            "amount": round(item.cost, 2),
            "currency": "USD",
        }
        for item in costs
    ]
    service_costs.sort(key=lambda item: item["amount"], reverse=True)

    resource_summary = {
        "total": len(resources),
        "unused": sum(1 for item in resources if item.status.lower() == "unused"),
        "underutilized": sum(
            1 for item in resources if item.status.lower() == "underutilized"
        ),
    }

    recommendation_data = [
        {
            "resource": item.resource,
            "issue": item.issue,
            "recommendation": item.recommendation,
            "estimated_savings": round(item.estimated_savings, 2),
        }
        for item in recommendations
    ]

    potential_savings = round(
        sum(item["estimated_savings"] for item in recommendation_data), 2
    )

    return {
        "currency": "USD",
        "days": days,
        "total_cost": total_cost,
        "previous_month_cost": total_cost,
        "potential_savings": potential_savings,
        "daily_costs": daily_costs,
        "services": service_costs,
        "resources": resource_summary,
        "recommendations": recommendation_data,
        "data_source": "demo",
    }
