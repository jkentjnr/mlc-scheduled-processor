resource "aws_sfn_state_machine" "workflow" {
  name     = "${local.workspaceName}-workflow"
  role_arn = aws_iam_role.step_role.arn

  definition = <<EOF
{
  "Comment": "Workflow for Scheduled Processor",
  "StartAt": "SourceData",
  "States": {
    "SourceData": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.workflow-extract.arn}",
      "Retry": [ {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 5,
        "MaxAttempts": 3,
        "BackoffRate": 5
      } ],
      "End": true
    }
  }
}
EOF
}