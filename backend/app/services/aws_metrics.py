from datetime import datetime, timedelta, timezone

import boto3

from app.config import settings


EC2_UNDERUTILIZED_CPU = 10.0
RDS_UNDERUTILIZED_CPU = 10.0


def _average_metric(cloudwatch, namespace, metric_name, dimensions, days=7):
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    response = cloudwatch.get_metric_statistics(
        Namespace=namespace,
        MetricName=metric_name,
        Dimensions=dimensions,
        StartTime=start,
        EndTime=end,
        Period=3600,
        Statistics=["Average"],
    )
    datapoints = response.get("Datapoints", [])
    if not datapoints:
        return None
    return round(sum(point["Average"] for point in datapoints) / len(datapoints), 2)


def enrich_utilization(resources, days=7):
    """Add CloudWatch utilization to EC2/RDS resources when metrics exist."""
    cloudwatch = boto3.client("cloudwatch", region_name=settings.aws_region)

    for resource in resources:
        details = resource.setdefault("details", {})
        try:
            if resource["type"] == "EC2":
                cpu = _average_metric(
                    cloudwatch,
                    "AWS/EC2",
                    "CPUUtilization",
                    [{"Name": "InstanceId", "Value": resource["id"]}],
                    days,
                )
                details["avg_cpu_percent"] = cpu
                if cpu is not None and cpu < EC2_UNDERUTILIZED_CPU and resource["status"] == "running":
                    resource["status"] = "underutilized"

            elif resource["type"] == "RDS":
                cpu = _average_metric(
                    cloudwatch,
                    "AWS/RDS",
                    "CPUUtilization",
                    [{"Name": "DBInstanceIdentifier", "Value": resource["id"]}],
                    days,
                )
                details["avg_cpu_percent"] = cpu
                if cpu is not None and cpu < RDS_UNDERUTILIZED_CPU and resource["status"] == "available":
                    resource["status"] = "underutilized"
        except Exception as exc:
            details["metrics_error"] = str(exc)

    return resources
