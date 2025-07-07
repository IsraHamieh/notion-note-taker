variable "aws_region" { default = "us-east-1" }
variable "project_name" { default = "notion-agent" }
variable "domain_name" { default = "yourdomain.com" }
variable "frontend_bucket_name" { default = "notion-agent-frontend" }
variable "backend_image" { description = "ECR image for backend" }
variable "frontend_build_dir" { default = "../frontend/build" } 