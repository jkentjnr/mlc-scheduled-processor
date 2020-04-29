resource "aws_kms_alias" "app-key" {
  name          = "alias/${var.name}/${terraform.workspace}/app-key"
  target_key_id = aws_kms_key.app-key.key_id
}

resource "aws_kms_key" "app-key" {
  description             = "${local.workspaceName} app key"
  deletion_window_in_days = 10

  tags = {
    STAGE = terraform.workspace
  }
}