from fastapi import APIRouter, HTTPException, Query

from app.services.dashboard import build_dashboard

router = APIRouter()


@router.get("/dashboard")
def get_dashboard(days: int = Query(default=7, ge=1, le=90)):
    try:
        return build_dashboard(days)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to build dashboard data: {exc}",
        )


@router.get("/costs")
def get_costs(days: int = Query(default=7, ge=1, le=90)):
    try:
        dashboard = build_dashboard(days)
        return {
            "currency": dashboard["currency"],
            "days": dashboard["days"],
            "total": dashboard["total_cost"],
            "daily": dashboard["daily_costs"],
            "services": dashboard["services"],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve AWS cost data: {exc}",
        )


@router.get("/resources")
def get_resources():
    return {
        "total": 0,
        "unused": 0,
        "underutilized": 0,
    }


@router.get("/recommendations")
def get_recommendations():
    return []
