resource "aws_secretsmanager_secret" "secret_s3_bucket" {
  name        = "${var.name}/${terraform.workspace}/s3_bucket"
  description = "S3 Bucket"
  kms_key_id  = aws_kms_key.app-key.arn

  tags = {
    STAGE = "${terraform.workspace}"
  }
}

resource "aws_secretsmanager_secret" "step_function_arn" {
  name        = "${var.name}/${terraform.workspace}/step_function_arn"
  description = "Workflow Step Function ARN"
  kms_key_id  = aws_kms_key.app-key.arn

  tags = {
    STAGE = "${terraform.workspace}"
  }
}

resource "aws_secretsmanager_secret_version" "secret_s3_bucket_endpoint" {
  secret_id     = aws_secretsmanager_secret.secret_s3_bucket.id
  secret_string = aws_s3_bucket.reporting-bucket.bucket
}

resource "aws_secretsmanager_secret_version" "step_function_arn" {
  secret_id     = aws_secretsmanager_secret.step_function_arn.id
  secret_string = aws_sfn_state_machine.workflow.id
}
