locals {
  lambda-workflow-query-function_name = "${local.workspaceName}-lambda-workflow-query"
}

resource "aws_lambda_function" "workflow-query" {
  s3_bucket        = var.dropbox_bucket
  s3_key           = "${terraform.workspace}/lambda.zip"
  source_code_hash = filebase64sha256("../../.serverless/default.zip")

  function_name    = local.lambda-workflow-query-function_name
  role             = aws_iam_role.lambda_role.arn
  handler          = "lib/workflowHandler.query"
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

resource "aws_cloudwatch_log_group" "workflow-query" {
  name              = "/aws/lambda/${local.lambda-workflow-query-function_name}"
  retention_in_days = var.production == 0 ? 1 : 30
}