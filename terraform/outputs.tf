output "vpc_id" {
  description = "CloudCostOps VPC ID"
  value       = aws_vpc.cloudcostops.id
}

output "vpc_cidr" {
  description = "CloudCostOps VPC CIDR"
  value       = aws_vpc.cloudcostops.cidr_block
}

output "backend_ecr_repository_url" {
  description = "ECR repository URL for the CloudCostOps backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_repository_url" {
  description = "ECR repository URL for the CloudCostOps frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "github_actions_role_arn" {
  description = "IAM role ARN used by GitHub Actions"
  value       = aws_iam_role.github_actions.arn
}

output "eks_cluster_name" {
  description = "CloudCostOps EKS cluster name"
  value       = aws_eks_cluster.cloudcostops.name
}

output "eks_cluster_endpoint" {
  description = "CloudCostOps EKS API endpoint"
  value       = aws_eks_cluster.cloudcostops.endpoint
}

output "eks_node_group_name" {
  description = "CloudCostOps EKS node group name"
  value       = aws_eks_node_group.cloudcostops.node_group_name
}