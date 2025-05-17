provider "aws" {
  region = "eu-central-1" // Frankfurt
}

terraform {
  backend "s3" {
    bucket         = "fibroguardian-terraform-state-bucket" // Zorg dat deze bucket bestaat en uniek is
    key            = "production/fibroguardian.tfstate"
    region         = "eu-central-1"
    encrypt        = true
    // dynamodb_table = "fibroguardian-terraform-locks" // Optioneel, voor state locking
  }
}

// Variabelen (kunnen ook in een apart .tfvars bestand)
variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "fibroguardian"
}

variable "environment" {
  description = "The environment (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "supabase_url_ssm_path" {
  description = "Path to Supabase URL in SSM Parameter Store"
  type        = string
  default     = "/${var.project_name}/${var.environment}/NEXT_PUBLIC_SUPABASE_URL"
}

variable "supabase_anon_key_ssm_path" {
  description = "Path to Supabase Anon Key in SSM Parameter Store"
  type        = string
  default     = "/${var.project_name}/${var.environment}/NEXT_PUBLIC_SUPABASE_ANON_KEY"
}

variable "stripe_secret_key_ssm_path" {
  description = "Path to Stripe Secret Key in SSM Parameter Store"
  type        = string
  default     = "/${var.project_name}/${var.environment}/STRIPE_SECRET_KEY"
}

variable "app_image_tag" {
  description = "Docker image tag for the application (e.g., v1.0.0)"
  type        = string
  default     = "latest" // Kan worden overschreven door CI/CD
}

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  app_image_url = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${aws_ecr_repository.app.name}:${var.app_image_tag}"
}

data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {}

// VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.common_tags, { Name = "${var.project_name}-vpc" })
}

// Subnets (voorbeeld: 2 publiek, 2 privaat)
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "${var.project_name}-public-subnet-a" })
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "${var.project_name}-public-subnet-b" })
}

// Internet Gateway voor publieke subnets
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${var.project_name}-igw" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
  tags = merge(local.common_tags, { Name = "${var.project_name}-public-rt" })
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}
resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}


// ECR Repository
resource "aws_ecr_repository" "app" {
  name                 = "${var.project_name}-app-repo" // Unieke naam
  image_tag_mutability = "MUTABLE"    // Of "IMMUTABLE" voor productie
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = local.common_tags
}

// IAM Roles (vereenvoudigd, pas permissies aan naar behoefte)
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.project_name}-ecs-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  ]
  tags = local.common_tags
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
  // Voeg hier permissies toe die je applicatie nodig heeft (bv. S3, andere AWS services)
  // Voorbeeld: inline_policy { name = "AppPermissions", policy = jsonencode({...}) }
  tags = local.common_tags
}


// CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project_name}-app"
  retention_in_days = 30
  tags              = local.common_tags
}

// ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = local.common_tags
}

// ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-app-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024" // 1 vCPU
  memory                   = "2048" // 2 GB RAM
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn // Optioneel, als je app AWS services aanroept
  
  container_definitions = jsonencode([
    {
      name      = "${var.project_name}-app-container"
      image     = local.app_image_url // Gebruik de URL met de tag
      cpu       = 1024
      memory    = 2048
      essential = true
      portMappings = [
        { containerPort = 3000, hostPort = 3000, protocol = "tcp" }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" }
        // Andere non-sensitive env vars
      ]
      secrets = [ // Haal secrets uit SSM Parameter Store
        { name = "NEXT_PUBLIC_SUPABASE_URL", valueFrom = data.aws_ssm_parameter.supabase_url.arn },
        { name = "NEXT_PUBLIC_SUPABASE_ANON_KEY", valueFrom = data.aws_ssm_parameter.supabase_anon_key.arn },
        { name = "STRIPE_SECRET_KEY", valueFrom = data.aws_ssm_parameter.stripe_secret_key.arn },
        // Voeg hier meer secrets toe indien nodig
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs-${var.project_name}"
        }
      }
      // Health check (optioneel maar aanbevolen)
      // healthCheck = {
      //   command = ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      //   interval = 30
      //   timeout = 5
      //   retries = 3
      //   startPeriod = 60
      // }
    }
  ])
  tags = local.common_tags
}

// Security Groups
resource "aws_security_group" "lb" {
  name        = "${var.project_name}-lb-sg"
  description = "Controls access to the ALB"
  vpc_id      = aws_vpc.main.id
  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    protocol    = "-1" // All
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.common_tags
}

resource "aws_security_group" "app" {
  name        = "${var.project_name}-app-sg"
  description = "Controls access to the Fargate tasks"
  vpc_id      = aws_vpc.main.id
  ingress { // Allow traffic from ALB on port 3000
    protocol        = "tcp"
    from_port       = 3000
    to_port         = 3000
    security_groups = [aws_security_group.lb.id]
  }
  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.common_tags
}


// Application Load Balancer (ALB)
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]
  enable_deletion_protection = false // Zet op true voor productie
  tags               = local.common_tags
}

resource "aws_lb_target_group" "app" {
  name        = "${var.project_name}-app-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  health_check {
    path                = "/api/health" // Zorg dat dit endpoint bestaat en 200 retourneert
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
  tags = local.common_tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-Ext-2018-06" // Recente policy
  certificate_arn   = data.aws_acm_certificate.cert.arn // Gebruik data source voor certificaat
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

// ECS Service
resource "aws_ecs_service" "app" {
  name            = "${var.project_name}-app-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2 // Start met 2 instances
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets         = [aws_subnet.public_a.id, aws_subnet.public_b.id] // Gebruik publieke subnets voor Fargate met public IP
    security_groups = [aws_security_group.app.id]
    assign_public_ip = true // Nodig voor Fargate taken in publieke subnets om images te pullen etc.
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "${var.project_name}-app-container"
    container_port   = 3000
  }
  
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  
  // Optioneel: Service Discovery (Route 53)
  // service_registries {
  //   registry_arn = aws_service_discovery_service.app.arn
  // }
  
  tags = local.common_tags
  depends_on = [aws_lb_listener.https] // Zorg dat listener bestaat voor service
}

// ACM Certificate (veronderstelt dat het certificaat al bestaat en gevalideerd is)
data "aws_acm_certificate" "cert" {
  domain      = "fibroguardian.be" // Vervang met je domeinnaam
  statuses    = ["ISSUED"]
  most_recent = true
}

// CloudFront Distribution (optioneel, als je CloudFront voor de ALB wilt zetten)
// resource "aws_cloudfront_distribution" "main" { ... }

// SSM Parameters (data sources, veronderstelt dat deze al bestaan)
data "aws_ssm_parameter" "supabase_url" {
  name = var.supabase_url_ssm_path
}
data "aws_ssm_parameter" "supabase_anon_key" {
  name = var.supabase_anon_key_ssm_path
}
data "aws_ssm_parameter" "stripe_secret_key" {
  name = var.stripe_secret_key_ssm_path
}

// Outputs
output "app_load_balancer_dns" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "app_url" {
  description = "Assumed production URL of the application"
  value       = "https://fibroguardian.be" // Vervang met je daadwerkelijke domein
}
