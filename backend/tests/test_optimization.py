from app.services.recommendation_engine import generate_recommendations
from app.services.resource_inventory import summarize_resources


def test_resource_summary_counts_status_and_type():
    resources = [
        {"id": "i-1", "type": "EC2", "status": "unused", "source": "demo"},
        {"id": "i-2", "type": "EC2", "status": "underutilized", "source": "demo"},
        {"id": "v-1", "type": "EBS", "status": "unused", "source": "demo"},
        {"id": "db-1", "type": "RDS", "status": "available", "source": "demo"},
    ]

    assert summarize_resources(resources) == {
        "total": 4,
        "unused": 2,
        "underutilized": 1,
        "by_type": {"EC2": 2, "EBS": 1, "RDS": 1},
    }


def test_recommendations_flag_stopped_ec2_and_unused_ebs():
    resources = [
        {"id": "i-stopped", "type": "EC2", "status": "stopped", "source": "aws"},
        {"id": "vol-unused", "type": "EBS", "status": "unused", "source": "aws"},
        {"id": "rds-live", "type": "RDS", "status": "available", "source": "aws"},
    ]

    recommendations = generate_recommendations(resources)

    assert [item["resource"] for item in recommendations] == ["i-stopped", "vol-unused"]
    assert recommendations[0]["issue"] == "Stopped EC2 instance"
    assert recommendations[1]["issue"] == "Unattached EBS volume"
