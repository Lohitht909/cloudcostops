from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.services.aws_account import get_account_context
from app.services.aws_metrics import enrich_utilization
from app.services.dashboard import build_dashboard
from app.services.resource_inventory import list_resources, summarize_resources

router = APIRouter()


def _current_resources(db: Session, days: int = 7):
    resources = list_resources(db)
    if settings.data_source == "aws":
        resources = enrich_utilization(resources, days)
    return resources


@router.get("/dashboard")
def get_dashboard(
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    try:
        return build_dashboard(db, days)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to build dashboard data: {exc}") from exc


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
            "previous_period": dashboard["previous_month_cost"],
            "change_percent": dashboard["cost_change_percent"],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to retrieve cost data: {exc}") from exc


@router.get("/resources")
def get_resources(
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    try:
        return _current_resources(db, days)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to retrieve resources: {exc}") from exc


@router.get("/resources/summary")
def get_resource_summary(
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    try:
        return summarize_resources(_current_resources(db, days))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to summarize resources: {exc}") from exc


@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    try:
        return build_dashboard(db, 7)["recommendations"]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to retrieve recommendations: {exc}") from exc


@router.get("/aws/context")
def get_aws_context():
    if settings.data_source != "aws":
        return {
            "data_source": "demo",
            "account_id": None,
            "region": settings.aws_region,
        }

    try:
        return {"data_source": "aws", **get_account_context()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to identify AWS account: {exc}") from exc
