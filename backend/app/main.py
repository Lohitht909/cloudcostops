from fastapi import FastAPI
from app.routes.dashboard import router as dashboard_router

app = FastAPI(
    title="CloudCostOps API",
    version="1.0.0"
)

app.include_router(dashboard_router, prefix="/api")


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "cloudcostops-backend"
    }