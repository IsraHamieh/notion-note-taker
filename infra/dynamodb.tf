resource "aws_dynamodb_table" "user_keys" {
  name           = "notion_agent_user_keys"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "user_id"
  attribute {
    name = "user_id"
    type = "S"
  }
  server_side_encryption { enabled = true }
  tags = { Name = "${var.project_name}-user-keys" }
}

resource "aws_dynamodb_table" "chats" {
  name           = "notion_agent_chats"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "user_id"
  range_key      = "chat_id"
  attribute {
    name = "user_id"
    type = "S"
  }
  attribute {
    name = "chat_id"
    type = "S"
  }
  global_secondary_index {
    name               = "user_id-timestamp-index"
    hash_key           = "user_id"
    range_key          = "timestamp"
    projection_type    = "ALL"
  }
  attribute {
    name = "timestamp"
    type = "S"
  }
  server_side_encryption { enabled = true }
  tags = { Name = "${var.project_name}-chats" }
} 