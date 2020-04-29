resource "aws_cloudwatch_event_rule" "extract" {
    name = "${local.workspaceName}-extract"
    description = "Extracts the data from the source system"
    schedule_expression = var.cron_extract_schedule
    is_enabled = var.cron_extract_enable
}

resource "aws_cloudwatch_event_target" "extract" {
    rule = aws_cloudwatch_event_rule.extract.name
    target_id = "extract"
    arn = aws_lambda_function.cron-extract.arn
    # input = "{\"pathParameters\": { \"key\": \"heartbeat\" } }"
}

resource "aws_lambda_permission" "cron-extract" {
    statement_id = "AllowExecutionFromCloudWatch"
    action = "lambda:InvokeFunction"
    function_name = aws_lambda_function.cron-extract.arn
    principal = "events.amazonaws.com"
    source_arn = aws_cloudwatch_event_rule.extract.arn
}