from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class OptimizationRule:
    resource_type: str
    status: str
    issue: str
    recommendation: str
    priority: str


RULES = (
    OptimizationRule(
        "EC2",
        "stopped",
        "Stopped EC2 instance",
        "Review and terminate the instance if it is no longer required.",
        "high",
    ),
    OptimizationRule(
        "EBS",
        "unused",
        "Unattached EBS volume",
        "Review the volume and delete it after confirming that its data is no longer required.",
        "high",
    ),
    OptimizationRule(
        "EC2",
        "underutilized",
        "Underutilized EC2 instance",
        "Review CPU and memory utilization and consider rightsizing the instance.",
        "medium",
    ),
    OptimizationRule(
        "RDS",
        "underutilized",
        "Underutilized RDS instance",
        "Review database utilization and consider a smaller instance class or schedule.",
        "medium",
    ),
)


def analyze_resources(resources: list[dict[str, Any]]) -> list[dict[str, Any]]:
    recommendations = []
    rules = {(rule.resource_type, rule.status): rule for rule in RULES}

    for resource in resources:
        resource_type = str(resource.get("type", "")).upper()
        status = str(resource.get("status", "")).lower()
        rule = rules.get((resource_type, status))
        if not rule:
            continue

        recommendations.append(
            {
                "resource": resource.get("id"),
                "resource_type": resource_type,
                "issue": rule.issue,
                "recommendation": rule.recommendation,
                "priority": rule.priority,
                "estimated_savings": 0.0,
                "savings_status": "requires_pricing_or_usage_data",
                "source": resource.get("source", "unknown"),
            }
        )

    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda item: priority_order.get(item["priority"], 99))
    return recommendations
