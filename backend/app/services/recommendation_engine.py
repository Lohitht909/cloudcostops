def generate_recommendations(resources):
    recommendations = []

    for resource in resources:
        resource_id = resource["id"]
        resource_type = resource["type"]
        status = resource["status"].lower()

        if resource_type == "EC2" and status == "stopped":
            recommendations.append(
                {
                    "resource": resource_id,
                    "issue": "Stopped EC2 instance",
                    "recommendation": "Review the instance and terminate it if it is no longer required.",
                    "estimated_savings": 0.0,
                }
            )

        if resource_type == "EBS" and status == "unused":
            recommendations.append(
                {
                    "resource": resource_id,
                    "issue": "Unattached EBS volume",
                    "recommendation": "Delete the volume after confirming that its data is no longer required.",
                    "estimated_savings": 0.0,
                }
            )

    return recommendations
