resource "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket_name
  acl    = "private"
  force_destroy = true

  versioning { enabled = true }
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
  tags = { Name = "${var.project_name}-frontend" }
}

resource "aws_s3_bucket" "uploads" {
  bucket = "${var.project_name}-uploads"
  acl    = "private"
  force_destroy = true
  versioning { enabled = true }
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
  tags = { Name = "${var.project_name}-uploads" }
} 