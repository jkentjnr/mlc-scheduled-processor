resource "aws_sfn_state_machine" "workflow" {
  name     = "${local.workspaceName}-workflow"
  role_arn = aws_iam_role.step_role.arn

  definition = <<EOF
{
  "Comment": "Workflow for Scheduled Processor",
  "StartAt": "QueryData",
  "States": {
    "QueryData": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.workflow-query.arn}",
      "Retry": [ {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 5,
        "MaxAttempts": 3,
        "BackoffRate": 5
      } ],
      "Next": "JournalQueryStatus"
    },
    "JournalQueryStatus": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.workflow-journal.arn}",
      "Retry": [ {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 5,
        "MaxAttempts": 3,
        "BackoffRate": 5
      } ],
      "Next": "TransformEachDataEntry"
    },
    "TransformEachDataEntry": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.workflow-transform.arn}",
      "Retry": [ {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 5,
        "MaxAttempts": 3,
        "BackoffRate": 5
      } ],
      "Next": "JournalTransformStatus"
    },
    "JournalTransformStatus": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.workflow-journal.arn}",
      "Retry": [ {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 5,
        "MaxAttempts": 3,
        "BackoffRate": 5
      } ],
      "Next": "TransformEvaluation"
    },
    "TransformEvaluation": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.end",
          "BooleanEquals": true,
          "Next": "RenderEachDataEntry"
        }
      ],
      "Default": "TransformEachDataEntry"
    },
    "RenderEachDataEntry": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.workflow-renderer.arn}",
      "Retry": [ {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 5,
        "MaxAttempts": 3,
        "BackoffRate": 5
      } ],
      "Next": "JournalRenderStatus"
    },
    "JournalRenderStatus": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.workflow-journal.arn}",
      "Retry": [ {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 5,
        "MaxAttempts": 3,
        "BackoffRate": 5
      } ],
      "Next": "RenderEvaluation"
    },
    "RenderEvaluation": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.end",
          "BooleanEquals": true,
          "Next": "FinaliseRender"
        }
      ],
      "Default": "RenderEachDataEntry"
    },
    "FinaliseRender": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.workflow-renderer-finaliser.arn}",
      "Retry": [ {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 5,
        "MaxAttempts": 3,
        "BackoffRate": 5
      } ],
      "Next": "JournalRenderFinalStatus"
    },
    "JournalRenderFinalStatus": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.workflow-journal.arn}",
      "Retry": [ {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 5,
        "MaxAttempts": 3,
        "BackoffRate": 5
      } ],
      "Next": "Finalise"
    },
    "Finalise": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.workflow-finaliser.arn}",
      "Retry": [ {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 5,
        "MaxAttempts": 3,
        "BackoffRate": 5
      } ],
      "Next": "JournalFinalStatus"
    },
    "JournalFinalStatus": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.workflow-journal.arn}",
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