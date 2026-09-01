from datetime import date, timedelta

import boto3

from app.config import settings


def get_cost_explorer_client():
    return boto3.client("ce", region_name=settings.aws_region)


def _period(days: int, offset_days: int = 0):
    end_date = date.today() - timedelta(days=offset_days)
    start_date = end_date - timedelta(days=days)
    return start_date.isoformat(), end_date.isoformat()


def _query(start_date, end_date, group_by=None):
    client = get_cost_explorer_client()
    kwargs = {
        "TimePeriod": {"Start": start_date, "End": end_date},
        "Granularity": "DAILY",
        "Metrics": ["UnblendedCost"],
    }
    if group_by:
        kwargs["GroupBy"] = group_by
    return client.get_cost_and_usage(**kwargs)


def get_daily_costs(days: int = 7):
    start_date, end_date = _period(days)
    response = _query(start_date, end_date)
    results = []

    for item in response.get("ResultsByTime", []):
        metric = item["Total"]["UnblendedCost"]
        results.append(
            {
                "date": item["TimePeriod"]["Start"],
                "amount": round(float(metric["Amount"]), 2),
                "currency": metric["Unit"],
                "estimated": item.get("Estimated", False),
            }
        )

    return results


def get_service_costs(days: int = 7):
    start_date, end_date = _period(days)
    response = _query(
        start_date,
        end_date,
        [{"Type": "DIMENSION", "Key": "SERVICE"}],
    )

    services = {}
    for day in response.get("ResultsByTime", []):
        for group in day.get("Groups", []):
            service_name = group["Keys"][0]
            metric = group["Metrics"]["UnblendedCost"]
            service = services.setdefault(
                service_name,
                {"name": service_name, "amount": 0.0, "currency": metric["Unit"]},
            )
            service["amount"] += float(metric["Amount"])

    result = list(services.values())
    for service in result:
        service["amount"] = round(service["amount"], 2)
    result.sort(key=lambda service: service["amount"], reverse=True)
    return result


def get_cost_summary(days: int = 7):
    current_start, current_end = _period(days)
    previous_start, previous_end = _period(days, offset_days=days)

    current = _query(current_start, current_end)
    previous = _query(previous_start, previous_end)

    def total(response):
        return round(
            sum(
                float(item["Total"]["UnblendedCost"]["Amount"])
                for item in response.get("ResultsByTime", [])
            ),
            2,
        )

    current_total = total(current)
    previous_total = total(previous)
    change = None if previous_total == 0 else round(
        ((current_total - previous_total) / previous_total) * 100, 2
    )

    currency = next(
        (
            item["Total"]["UnblendedCost"]["Unit"]
            for item in current.get("ResultsByTime", [])
        ),
        "USD",
    )

    return {
        "current": current_total,
        "previous": previous_total,
        "change_percent": change,
        "currency": currency,
    }
