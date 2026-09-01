# CloudCostOps

CloudCostOps is a cloud cost intelligence and optimization platform designed to help teams understand cloud spend, inventory resources, and identify optimization opportunities.

## Current application

- React + Vite frontend
- FastAPI backend
- PostgreSQL data store
- AWS Cost Explorer integration
- AWS resource discovery for EC2, EBS, RDS, S3 and EKS
- Rule-based optimization recommendations
- Docker Compose local environment
- Production-ready frontend container using Nginx
- Automated backend tests and frontend build in GitHub Actions

## Cost-conscious development

The application defaults to demo mode, so AWS infrastructure is **not required** for local development.

```text
CLOUDCOSTOPS_DATA_SOURCE=demo
```

Demo data is seeded into PostgreSQL by the local Compose startup command.

AWS mode can be enabled later after the AWS infrastructure and IAM permissions are provisioned:

```text
CLOUDCOSTOPS_DATA_SOURCE=aws
AWS_REGION=us-east-1
```

The application should receive AWS credentials through the deployment platform rather than storing credentials in Git.

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

Backend API:

```text
http://localhost:8000/docs
```

Stop it:

```bash
docker compose down
```

To remove the local PostgreSQL volume as well:

```bash
docker compose down -v
```

## API

```text
GET /api/health
GET /api/dashboard?days=7
GET /api/costs?days=7
GET /api/resources
GET /api/resources/summary
GET /api/recommendations
```

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
   +--> AWS Cost Explorer   (AWS mode)
   |
   +--> EC2/EBS/RDS/S3/EKS  (AWS mode)
   |
   v
Optimization Engine
```

## Deployment roadmap

The application is being developed before AWS infrastructure is provisioned to keep development costs near zero.

1. Complete and test the application locally.
2. Provision AWS infrastructure with Terraform.
3. Push application images to ECR.
4. Deploy to EKS with Helm.
5. Use ArgoCD for lower environments.
6. Use Jenkins with manual approval for production.
