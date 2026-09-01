from datetime import datetime, timedelta, timezone

import boto3

from app.config import settings


def _client():
    return boto3.client("cloudwatch", region_name=settings.aws_region)


def _average_metric(namespace, metric_name, dimensions, hours=24):
    end = datetime.now(timezone.utc)
    start = end - timedelta(hours=hours)
    response = _client().get_metric_statistics(
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


def get_ec2_cpu(instance_id):
    return _average_metric(
        "AWS/EC2",
        "CPUUtilization",
        [{"Name": "InstanceId", "Value": instance_id}],
    )


def get_rds_cpu(db_identifier):
    return _average_metric(
        "AWS/RDS",
        "CPUUtilization",
        [{"Name": "DBInstanceIdentifier", "Value": db_identifier}],
    )


def enrich_resource_metrics(resources):
    enriched = []
    for resource in resources:
        item = dict(resource)
        details = dict(item.get("details") or {})
        if item.get("type") == "EC2" and item.get("status") == "running":
            cpu = get_ec2_cpu(item["id"])
            details["cpu_utilization_24h"] = cpu
            if cpu is not None and cpu < 10:
                item["status"] = "underutilized"
        elif item.get("type") == "RDS" and item.get("status") == "available":
            cpu = get_rds_cpu(item["id"])
            details["cpu_utilization_24h"] = cpu
            if cpu is not None and cpu < 10:
                item["status"] = "underutilized"
        item["details"] = details
        enriched.append(item)
    return enriched
