output "alb_dns_name" {
  value = aws_lb.backend.dns_name
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "dynamodb_keys_table" {
  value = aws_dynamodb_table.user_keys.name
}

output "dynamodb_chats_table" {
  value = aws_dynamodb_table.chats.name
} 