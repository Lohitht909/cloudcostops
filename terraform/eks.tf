resource "aws_eks_cluster" "cloudcostops" {
  name     = "cloudcostops-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.33"

  vpc_config {
    subnet_ids = [
      aws_subnet.public_1.id,
      aws_subnet.public_2.id
    ]

    endpoint_public_access  = true
    endpoint_private_access = true
  }

  access_config {
    authentication_mode = "API_AND_CONFIG_MAP"
  }

  tags = {
    Name        = "cloudcostops-cluster"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
}

resource "aws_eks_node_group" "cloudcostops" {
  cluster_name    = aws_eks_cluster.cloudcostops.name
  node_group_name = "cloudcostops-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn

  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]

  instance_types = ["m7i-flex.large"]

  capacity_type = "ON_DEMAND"

  scaling_config {
    desired_size = 1
    min_size     = 1
    max_size     = 2
  }

  update_config {
    max_unavailable = 1
  }

  tags = {
    Name        = "cloudcostops-node"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node,
    aws_iam_role_policy_attachment.eks_cni,
    aws_iam_role_policy_attachment.eks_ecr_readonly
  ]
}


resource "aws_eks_addon" "pod_identity_agent" {
  cluster_name = aws_eks_cluster.cloudcostops.name
  addon_name   = "eks-pod-identity-agent"

  depends_on = [
    aws_eks_node_group.cloudcostops
  ]
}

resource "aws_iam_role" "ebs_csi" {
  name = "CloudCostOpsEBSCSIRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "pods.eks.amazonaws.com"
        }

        Action = [
          "sts:AssumeRole",
          "sts:TagSession"
        ]
      }
    ]
  })

  tags = {
    Name        = "CloudCostOpsEBSCSIRole"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy_attachment" "ebs_csi" {
  role       = aws_iam_role.ebs_csi.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

resource "aws_eks_addon" "ebs_csi" {
  cluster_name = aws_eks_cluster.cloudcostops.name
  addon_name   = "aws-ebs-csi-driver"

  pod_identity_association {
    role_arn        = aws_iam_role.ebs_csi.arn
    service_account = "ebs-csi-controller-sa"
  }

  depends_on = [
    aws_eks_node_group.cloudcostops,
    aws_eks_addon.pod_identity_agent,
    aws_iam_role_policy_attachment.ebs_csi
  ]
}


resource "aws_eks_access_entry" "admin" {
  cluster_name  = aws_eks_cluster.cloudcostops.name
  principal_arn = "arn:aws:iam::483176634994:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_AdministratorAccess_3942924358180bb6"
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "admin" {
  cluster_name  = aws_eks_cluster.cloudcostops.name
  principal_arn = aws_eks_access_entry.admin.principal_arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }
}

resource "aws_eks_pod_identity_association" "aws_load_balancer_controller" {
  cluster_name    = aws_eks_cluster.cloudcostops.name
  namespace       = "kube-system"
  service_account = "aws-load-balancer-controller"
  role_arn        = aws_iam_role.aws_load_balancer_controller.arn

  depends_on = [
    aws_eks_addon.pod_identity_agent
  ]
}

resource "aws_eks_pod_identity_association" "cloudcostops_backend" {
  cluster_name    = aws_eks_cluster.cloudcostops.name
  namespace       = "cloudcostops"
  service_account = "cloudcostops-backend"
  role_arn        = aws_iam_role.cloudcostops_backend.arn

  depends_on = [
    aws_eks_addon.pod_identity_agent
  ]
}