import boto3
from datetime import date, timedelta

from app.config import settings


def get_cost_explorer_client():
    return boto3.client(
        "ce",
        region_name=settings.aws_region,
    )


def get_daily_costs(days: int = 7):
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    client = get_cost_explorer_client()

    response = client.get_cost_and_usage(
        TimePeriod={
            "Start": start_date.isoformat(),
            "End": end_date.isoformat(),
        },
        Granularity="DAILY",
        Metrics=["UnblendedCost"],
    )

    results = []

    for item in response["ResultsByTime"]:
        amount = float(item["Total"]["UnblendedCost"]["Amount"])

        results.append(
            {
                "date": item["TimePeriod"]["Start"],
                "amount": amount,
                "currency": item["Total"]["UnblendedCost"]["Unit"],
                "estimated": item["Estimated"],
            }
        )

    return results


def get_service_costs(days: int = 7):
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    client = get_cost_explorer_client()

    response = client.get_cost_and_usage(
        TimePeriod={
            "Start": start_date.isoformat(),
            "End": end_date.isoformat(),
        },
        Granularity="DAILY",
        Metrics=["UnblendedCost"],
        GroupBy=[
            {
                "Type": "DIMENSION",
                "Key": "SERVICE",
            }
        ],
    )

    services = {}

    for day in response["ResultsByTime"]:
        for group in day["Groups"]:
            service_name = group["Keys"][0]
            amount = float(group["Metrics"]["UnblendedCost"]["Amount"])
            currency = group["Metrics"]["UnblendedCost"]["Unit"]

            if service_name not in services:
                services[service_name] = {
                    "name": service_name,
                    "amount": 0.0,
                    "currency": currency,
                }

            services[service_name]["amount"] += amount

    result = list(services.values())
    result.sort(key=lambda service: service["amount"], reverse=True)

    return result
