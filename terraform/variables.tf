variable "aws_region" {
  description = "AWS region for CloudCostOps"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "AWS CLI profile used by Terraform"
  type        = string
  default     = "cloudcostops"
}