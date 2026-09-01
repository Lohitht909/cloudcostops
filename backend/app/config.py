import os


class Settings:
    """AWS-specific CloudCostOps application configuration."""

    def __init__(self):
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://cloudcostops:cloudcostops@localhost:5432/cloudcostops",
        )
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.data_source = os.getenv("CLOUDCOSTOPS_DATA_SOURCE", "demo").lower()

        if self.data_source not in {"demo", "aws"}:
            raise ValueError("CLOUDCOSTOPS_DATA_SOURCE must be 'demo' or 'aws'")


settings = Settings()
