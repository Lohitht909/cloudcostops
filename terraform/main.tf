
data "aws_availability_zones" "available" {
  state = "available"
}


resource "aws_vpc" "cloudcostops" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "cloudcostops-vpc"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_internet_gateway" "cloudcostops" {
  vpc_id = aws_vpc.cloudcostops.id

  tags = {
    Name        = "cloudcostops-igw"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.cloudcostops.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "cloudcostops-public-1"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.cloudcostops.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "cloudcostops-public-2"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.cloudcostops.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "cloudcostops-private-1"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.cloudcostops.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "cloudcostops-private-2"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.cloudcostops.id

  tags = {
    Name        = "cloudcostops-public-rt"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.cloudcostops.id
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}



resource "aws_route_table" "private_1" {
  vpc_id = aws_vpc.cloudcostops.id

  tags = {
    Name        = "cloudcostops-private-rt-1"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_route_table" "private_2" {
  vpc_id = aws_vpc.cloudcostops.id

  tags = {
    Name        = "cloudcostops-private-rt-2"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}


resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private_1.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private_2.id
}





resource "aws_ecr_repository" "backend" {
  name                 = "cloudcostops-backend"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "cloudcostops-backend"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "cloudcostops-frontend"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "cloudcostops-frontend"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name        = "cloudcostops-nat-eip"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_nat_gateway" "cloudcostops" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1.id

  tags = {
    Name        = "cloudcostops-nat"
    Project     = "CloudCostOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }

  depends_on = [
    aws_internet_gateway.cloudcostops
  ]
}


resource "aws_route" "private_1_nat" {
  route_table_id         = aws_route_table.private_1.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.cloudcostops.id
}

resource "aws_route" "private_2_nat" {
  route_table_id         = aws_route_table.private_2.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.cloudcostops.id
}