import boto3
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Resource
from app.services.cloudwatch import enrich_resource_metrics


def _demo_resources(db: Session):
    resources = db.query(Resource).order_by(Resource.id).all()
    return [
        {
            "id": resource.name,
            "type": resource.resource_type,
            "status": resource.status,
            "source": "demo",
        }
        for resource in resources
    ]


def _aws_resources():
    resources = []

    ec2 = boto3.client("ec2", region_name=settings.aws_region)
    for page in ec2.get_paginator("describe_instances").paginate():
        for reservation in page.get("Reservations", []):
            for instance in reservation.get("Instances", []):
                resources.append(
                    {
                        "id": instance["InstanceId"],
                        "type": "EC2",
                        "status": instance.get("State", {}).get("Name", "unknown"),
                        "source": "aws",
                        "details": {
                            "instance_type": instance.get("InstanceType"),
                            "availability_zone": instance.get("Placement", {}).get("AvailabilityZone"),
                            "private_ip": instance.get("PrivateIpAddress"),
                        },
                    }
                )

    for page in ec2.get_paginator("describe_volumes").paginate():
        for volume in page.get("Volumes", []):
            attached = bool(volume.get("Attachments"))
            resources.append(
                {
                    "id": volume["VolumeId"],
                    "type": "EBS",
                    "status": "attached" if attached else "unused",
                    "source": "aws",
                    "details": {
                        "size_gb": volume.get("Size"),
                        "volume_type": volume.get("VolumeType"),
                        "availability_zone": volume.get("AvailabilityZone"),
                        "encrypted": volume.get("Encrypted", False),
                    },
                }
            )

    rds = boto3.client("rds", region_name=settings.aws_region)
    for page in rds.get_paginator("describe_db_instances").paginate():
        for instance in page.get("DBInstances", []):
            resources.append(
                {
                    "id": instance["DBInstanceIdentifier"],
                    "type": "RDS",
                    "status": instance.get("DBInstanceStatus", "unknown"),
                    "source": "aws",
                    "details": {
                        "engine": instance.get("Engine"),
                        "instance_class": instance.get("DBInstanceClass"),
                        "multi_az": instance.get("MultiAZ", False),
                    },
                }
            )

    s3 = boto3.client("s3", region_name=settings.aws_region)
    for bucket in s3.list_buckets().get("Buckets", []):
        resources.append(
            {
                "id": bucket["Name"],
                "type": "S3",
                "status": "active",
                "source": "aws",
                "details": {
                    "created": bucket.get("CreationDate").isoformat()
                    if bucket.get("CreationDate")
                    else None,
                },
            }
        )

    eks = boto3.client("eks", region_name=settings.aws_region)
    for page in eks.get_paginator("list_clusters").paginate():
        for cluster_name in page.get("clusters", []):
            resources.append(
                {
                    "id": cluster_name,
                    "type": "EKS",
                    "status": "active",
                    "source": "aws",
                }
            )

    return enrich_resource_metrics(resources)


def list_resources(db: Session):
    if settings.data_source == "aws":
        return _aws_resources()
    return _demo_resources(db)


def summarize_resources(resources):
    return {
        "total": len(resources),
        "unused": sum(1 for item in resources if item["status"].lower() == "unused"),
        "underutilized": sum(
            1 for item in resources if item["status"].lower() == "underutilized"
        ),
        "by_type": {
            resource_type: sum(1 for item in resources if item["type"] == resource_type)
            for resource_type in sorted({item["type"] for item in resources})
        },
    }
