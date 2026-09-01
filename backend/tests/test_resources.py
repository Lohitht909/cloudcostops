from app.services.recommendation_engine import generate_recommendations
from app.services.resource_inventory import summarize_resources


def test_summarize_resources():
    resources = [
        {"id": "i-1", "type": "EC2", "status": "underutilized"},
        {"id": "vol-1", "type": "EBS", "status": "unused"},
        {"id": "i-2", "type": "EC2", "status": "running"},
    ]

    assert summarize_resources(resources) == {
        "total": 3,
        "unused": 1,
        "underutilized": 1,
        "by_type": {"EC2": 2, "EBS": 1},
    }


def test_generate_recommendations_for_waste():
    resources = [
        {"id": "i-stopped", "type": "EC2", "status": "stopped"},
        {"id": "vol-unused", "type": "EBS", "status": "unused"},
        {"id": "i-running", "type": "EC2", "status": "running"},
    ]

    recommendations = generate_recommendations(resources)

    assert len(recommendations) == 2
    assert recommendations[0]["resource"] == "i-stopped"
    assert recommendations[1]["resource"] == "vol-unused"
