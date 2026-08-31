import boto3
from datetime import date, timedelta


def get_daily_costs(days: int = 7):
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    client = boto3.client(
        "ce",
        region_name="us-east-1"
    )

    response = client.get_cost_and_usage(
        TimePeriod={
            "Start": start_date.isoformat(),
            "End": end_date.isoformat()
        },
        Granularity="DAILY",
        Metrics=["UnblendedCost"]
    )

    results = []

    for item in response["ResultsByTime"]:
        results.append({
            "date": item["TimePeriod"]["Start"],
            "amount": float(
                item["Total"]["UnblendedCost"]["Amount"]
            ),
            "currency": item["Total"]["UnblendedCost"]["Unit"],
            "estimated": item["Estimated"]
        })

    return results