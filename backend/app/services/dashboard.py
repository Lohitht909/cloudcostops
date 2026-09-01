from app.services.cost_explorer import get_daily_costs, get_service_costs


def build_dashboard(days: int = 7):
    daily = get_daily_costs(days)
    services = get_service_costs(days)

    total_cost = round(sum(item["amount"] for item in daily), 2)

    return {
        "currency": daily[0]["currency"] if daily else "USD",
        "days": days,
        "total_cost": total_cost,
        "daily_costs": daily,
        "services": services,
    }
