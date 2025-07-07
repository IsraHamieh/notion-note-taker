provider "aws" {
  region = var.aws_region
}

terraform {
  required_version = ">= 1.3.0"
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "notion-agent/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
} 