from fastapi import APIRouter, HTTPException

from app.services.cost_explorer import get_daily_costs


router = APIRouter()


dashboard_data = {
    "monthly_cost": 1247.50,
    "previous_month_cost": 1112.30,
    "potential_savings": 283.40,

    "services": [
        {"name": "EC2", "cost": 520.00},
        {"name": "RDS", "cost": 310.00},
        {"name": "S3", "cost": 87.50},
        {"name": "EKS", "cost": 220.00},
        {"name": "Other", "cost": 110.00}
    ],

    "resources": {
        "total": 64,
        "unused": 17,
        "underutilized": 12
    },

    "recommendations": [
        {
            "resource": "EC2 i-012345",
            "issue": "Low CPU utilization",
            "recommendation": "Downsize instance",
            "estimated_savings": 48.00
        },
        {
            "resource": "EBS vol-07891",
            "issue": "Unattached volume",
            "recommendation": "Delete unused volume",
            "estimated_savings": 18.50
        },
        {
            "resource": "EC2 i-067891",
            "issue": "Non-production instance",
            "recommendation": "Schedule shutdown outside working hours",
            "estimated_savings": 72.00
        }
    ]
}


@router.get("/dashboard")
def get_dashboard():
    return dashboard_data


@router.get("/costs")
def get_costs():
    try:
        return {
            "currency": "USD",
            "days": 7,
            "data": get_daily_costs(7)
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve AWS cost data: {exc}"
        )


@router.get("/resources")
def get_resources():
    return dashboard_data["resources"]


@router.get("/recommendations")
def get_recommendations():
    return dashboard_data["recommendations"]