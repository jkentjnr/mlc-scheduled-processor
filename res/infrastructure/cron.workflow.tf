resource "aws_cloudwatch_event_rule" "workflow" {
    name = "${local.workspaceName}-workflow"
    description = "Executes Worklow that extracts the data from the source system."
    schedule_expression = var.cron_workflow_schedule
    is_enabled = var.cron_workflow_enable
}

resource "aws_cloudwatch_event_target" "workflow" {
    rule = aws_cloudwatch_event_rule.workflow.name
    target_id = "workflow"
    arn = aws_lambda_function.cron-workflow.arn
    input = "{\"pathParameters\": { \"jobId\": 1 } }"
}

resource "aws_lambda_permission" "cron-workflow" {
    statement_id = "AllowExecutionFromCloudWatch"
    action = "lambda:InvokeFunction"
    function_name = aws_lambda_function.cron-workflow.arn
    principal = "events.amazonaws.com"
    source_arn = aws_cloudwatch_event_rule.workflow.arn
}