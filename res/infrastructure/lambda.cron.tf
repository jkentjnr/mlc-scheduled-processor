locals {
  lambda-cron-workflow-function_name = "${local.workspaceName}-lambda-cron-workflow"
}

resource "aws_lambda_function" "cron-workflow" {
  s3_bucket        = var.dropbox_bucket
  s3_key           = "${terraform.workspace}/lambda.zip"
  source_code_hash = filebase64sha256("../../.serverless/default.zip")

  function_name    = local.lambda-cron-workflow-function_name
  role             = aws_iam_role.lambda_role.arn
  handler          = "lib/cronHandler.workflow"
  timeout          = var.internal_timeout
  memory_size      = var.lambda_memory_usage

  runtime = "nodejs12.x"

  #vpc_config {
  #    subnet_ids     = var.production == 0 ? [aws_subnet.private[0].id] : aws_subnet.private.*.id
  #    security_group_ids = ["${aws_security_group.rds.id}"]
  #}

  environment {
    variables = {
      PROJECT = "${var.name}",
      STAGE = "${terraform.workspace}"
    }
  }

}

resource "aws_cloudwatch_log_group" "cron-workflow" {
  name              = "/aws/lambda/${local.lambda-cron-workflow-function_name}"
  retention_in_days = var.production == 0 ? 1 : 30
}