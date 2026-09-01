# CloudCostOps

CloudCostOps is an **AWS-specific** cloud cost intelligence and optimization platform. It helps teams understand AWS spend, inventory AWS resources, and identify actionable optimization opportunities.

CloudCostOps intentionally targets **AWS only**. There is no multi-cloud abstraction or Azure/GCP support in the application roadmap.

## Application

- React + Vite frontend
- FastAPI backend
- PostgreSQL data store
- AWS Cost Explorer integration
- AWS resource discovery for EC2, EBS, RDS, S3 and EKS
- Rule-based AWS optimization recommendations
- Docker Compose local environment
- Production frontend container using Nginx
- Automated backend tests and frontend build

## Cost-conscious development

The application defaults to demo mode, so AWS infrastructure is **not required** for local development.

```text
CLOUDCOSTOPS_DATA_SOURCE=demo
```

Demo data is stored in PostgreSQL.

AWS mode is enabled later after AWS infrastructure and IAM permissions are provisioned:

```text
CLOUDCOSTOPS_DATA_SOURCE=aws
AWS_REGION=us-east-1
```

AWS credentials should be provided by the deployment platform and must not be committed to Git.

## Run locally

Requirements:

- Docker
- Docker Compose

Start the complete application:

```bash
docker compose up --build
```

Open:

```text
http://localhost:3000
```

Backend API documentation:

```text
http://localhost:8000/docs
```

Stop the application:

```bash
docker compose down
```

Remove the local PostgreSQL volume as well:

```bash
docker compose down -v
```

## API

```text
GET /api/health
GET /api/ready
GET /api/dashboard?days=7
GET /api/costs?days=7
GET /api/resources
GET /api/resources/summary
GET /api/recommendations
```

## AWS scope

The AWS integration is deliberately focused on services that are useful for cost visibility and optimization:

```text
AWS
│
├── Cost Explorer
├── EC2
├── EBS
├── RDS
├── S3
└── EKS
```

Future AWS-specific integrations may include CloudWatch metrics, Compute Optimizer, Trusted Advisor and Cost Anomaly Detection.

## Architecture

```text
Browser
   |
   v
Nginx / React
   |
   | /api
   v
FastAPI
   |
   +--> PostgreSQL
   |
   +--> AWS Cost Explorer
   |
   +--> AWS resource APIs
   |
   v
AWS Optimization Engine
```

## Deployment roadmap

Application development is completed before AWS infrastructure is provisioned to keep development costs near zero.

1. Complete and test the AWS-specific application locally.
2. Provision AWS infrastructure with Terraform.
3. Build and push application images to ECR.
4. Deploy to EKS with Helm.
5. Use ArgoCD for lower environments.
6. Use Jenkins with manual approval for production.
