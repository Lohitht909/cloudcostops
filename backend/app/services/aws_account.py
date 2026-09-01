import boto3

from app.config import settings


def get_account_context():
    """Return the AWS account and region resolved from the runtime credentials."""
    sts = boto3.client("sts", region_name=settings.aws_region)
    identity = sts.get_caller_identity()

    return {
        "account_id": identity["Account"],
        "region": settings.aws_region,
        "arn": identity.get("Arn"),
    }
