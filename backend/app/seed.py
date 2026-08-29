from app.database import SessionLocal, engine, Base
from app.models import Cost, Resource, Recommendation


Base.metadata.create_all(bind=engine)


def seed_database():

    db = SessionLocal()

    try:
        if db.query(Cost).count() == 0:
            costs = [
                Cost(service="EC2", cost=520.00),
                Cost(service="RDS", cost=310.00),
                Cost(service="S3", cost=87.50),
                Cost(service="EKS", cost=220.00),
                Cost(service="Other", cost=110.00),
            ]

            db.add_all(costs)

        if db.query(Resource).count() == 0:
            resources = [
                Resource(
                    name="i-012345",
                    resource_type="EC2",
                    status="underutilized"
                ),
                Resource(
                    name="vol-07891",
                    resource_type="EBS",
                    status="unused"
                ),
                Resource(
                    name="i-067891",
                    resource_type="EC2",
                    status="unused"
                ),
                Resource(
                    name="rds-prod",
                    resource_type="RDS",
                    status="active"
                ),
            ]

            db.add_all(resources)

        if db.query(Recommendation).count() == 0:
            recommendations = [
                Recommendation(
                    resource="EC2 i-012345",
                    issue="Low CPU utilization",
                    recommendation="Downsize instance",
                    estimated_savings=48.00
                ),
                Recommendation(
                    resource="EBS vol-07891",
                    issue="Unattached volume",
                    recommendation="Delete unused volume",
                    estimated_savings=18.50
                ),
                Recommendation(
                    resource="EC2 i-067891",
                    issue="Non-production instance",
                    recommendation="Schedule shutdown outside working hours",
                    estimated_savings=72.00
                ),
            ]

            db.add_all(recommendations)

        db.commit()

        print("Database seeded successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()