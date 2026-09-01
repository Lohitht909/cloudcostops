from fastapi import FastAPI
from sqlalchemy import text

from app.config import settings
from app.database import Base, engine
from app.routes.dashboard import router as dashboard_router


app = FastAPI(
    title="CloudCostOps API",
    description="Cloud cost intelligence, resource inventory and optimization API.",
    version="1.0.0",
)

app.include_router(dashboard_router, prefix="/api")


@app.on_event("startup")
def initialize_database():
    """Create application tables for a fresh development/deployment database."""
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "cloudcostops-backend",
        "version": app.version,
        "data_source": settings.data_source,
    }


@app.get("/api/ready")
def readiness():
    """Verify that the backend can reach PostgreSQL."""
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ready",
        "service": "cloudcostops-backend",
        "database": "reachable",
    }
