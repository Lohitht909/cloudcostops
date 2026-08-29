from sqlalchemy import Column, Integer, String, Float

from app.database import Base


class Cost(Base):
    __tablename__ = "costs"

    id = Column(Integer, primary_key=True, index=True)
    service = Column(String, nullable=False)
    cost = Column(Float, nullable=False)


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    status = Column(String, nullable=False)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    resource = Column(String, nullable=False)
    issue = Column(String, nullable=False)
    recommendation = Column(String, nullable=False)
    estimated_savings = Column(Float, nullable=False)