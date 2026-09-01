from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.dashboard import build_dashboard

router = APIRouter()


@router.get("/dashboard")
def get_dashboard(
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    try:
        return build_dashboard(db, days)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to build dashboard data: {exc}",
        ) from exc


@router.get("/costs")
def get_costs(
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    try:
        dashboard = build_dashboard(db, days)
        return {
            "currency": dashboard["currency"],
            "days": dashboard["days"],
            "total": dashboard["total_cost"],
            "daily": dashboard["daily_costs"],
            "services": dashboard["services"],
            "data_source": dashboard["data_source"],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve cost data: {exc}",
        ) from exc


@router.get("/resources")
def get_resources(db: Session = Depends(get_db)):
    try:
        dashboard = build_dashboard(db, 7)
        return dashboard["resources"]
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve resources: {exc}",
        ) from exc


@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    try:
        dashboard = build_dashboard(db, 7)
        return dashboard["recommendations"]
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve recommendations: {exc}",
        ) from exc
