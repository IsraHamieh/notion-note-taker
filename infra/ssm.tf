resource "aws_ssm_parameter" "fernet_key" {
  name  = "/${var.project_name}/fernet_key"
  type  = "SecureString"
  value = "GENERATE_THIS_AND_SET"
}

resource "aws_ssm_parameter" "langchain_api_key" {
  name  = "/${var.project_name}/langchain_api_key"
  type  = "SecureString"
  value = "YOUR_LANGCHAIN_API_KEY"
} 