resource "aws_iam_role" "step_role" {
  name = "${terraform.workspace}_step-function"
  assume_role_policy = data.aws_iam_policy_document.step_policy.json
}

// Assume role policy document
data "aws_iam_policy_document" "step_policy" {

  statement {
    actions = [
      "sts:AssumeRole"
    ]

    principals {
      type = "Service"
      identifiers = [
        "states.${var.aws_region}.amazonaws.com",
        "events.amazonaws.com"
      ]
    }
  }
}

resource "aws_iam_role_policy_attachment" "role_attach_custom_step" {
  role = aws_iam_role.step_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

#resource "aws_iam_role_policy_attachment" "role_attach_custom_step_dynamo" {
#  role = aws_iam_role.step_role.name
#  policy_arn = aws_iam_policy.lambda_dynamo_policy.arn
#}
