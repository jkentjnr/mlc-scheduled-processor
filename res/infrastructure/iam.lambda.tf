## Lambda role
resource "aws_iam_role" "lambda_role" {
  name = "${local.workspaceName}-lambda_role"
  path = var.iam_path

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "role_attach_lambda_role-lambdavpc" {
  role = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy_attachment" "role_attach_lambda_role-xray" {
  role = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

resource "aws_iam_role_policy_attachment" "role_attach_lambda_role-custom" {
  role = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

#resource "aws_iam_role_policy_attachment" "role_attach_lambda_role-dynamo" {
#  role = aws_iam_role.lambda_role.name
#  policy_arn = aws_iam_policy.lambda_dynamo_policy.arn
#}

#resource "aws_iam_policy" "lambda_dynamo_policy" {
#  name = "lambda_dynamo_policy-${terraform.workspace}"
#  description = "Lambda Execution Policy - Lambda"
#
#  policy = <<EOF
#{
#  "Version": "2012-10-17",
#  "Statement": [
#    {
#      "Action": [ "dynamodb:BatchGetItem", "dynamodb:GetItem", "dynamodb:BatchWriteItem", "dynamodb:WriteItem" ],
#      "Effect": "Allow",
#      "Resource": [
#        "${aws_dynamodb_table.everydayhero_campaigns.arn}",
#        "${aws_dynamodb_table.everydayhero_donations.arn}",
#        "${aws_dynamodb_table.everydayhero_donors.arn}",
#        "${aws_dynamodb_table.everydayhero_pages.arn}",
#        "${aws_dynamodb_table.everydayhero_teams.arn}",
#        "${aws_dynamodb_table.everydayhero_users.arn}"
#      ]
#    }
#  ]
#}
#EOF
#}

resource "aws_iam_policy" "lambda_policy" {
  name = "${local.workspaceName}-lambda_policy"
  description = "Lambda Execution Policy"
  path = var.iam_path

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [ "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey" ],
      "Effect": "Allow",
      "Resource": [
        "${aws_kms_key.app-key.arn}"
      ]
    },
    {
      "Action": [ "lambda:InvokeFunction" ],
      "Effect": "Allow",
      "Resource": [
        "${aws_lambda_function.cron-extract.arn}"
      ]
    },
    {
      "Action": [ "s3:PutObject", "s3:PutObjectAcl", "s3:GetObject", "s3:GetObjectAcl" ],
      "Effect": "Allow",
      "Resource": [
        "${aws_s3_bucket.reporting-bucket.arn}/*",
        "${aws_s3_bucket.reporting-bucket.arn}"
      ]
    },
    {
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}
