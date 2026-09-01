import os


class Settings:
    """Application configuration loaded from environment variables."""

    def __init__(self):
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://cloudcostops:cloudcostops@localhost:5432/cloudcostops",
        )
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.data_source = os.getenv("CLOUDCOSTOPS_DATA_SOURCE", "demo").lower()


settings = Settings()
