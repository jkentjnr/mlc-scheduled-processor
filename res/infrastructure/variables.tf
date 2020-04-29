variable "name" {
  description = "Name"
  default     = "mlc-scheduled-processor"
}

variable "dropbox_bucket" {
  description = "The S3 dropbox for development assets."
  default     = "mlc-scheduled-processor-dropbox"
}

variable "aws_profile" {
  description = "The AWS profile to use in the AWS credentials file."
  default     = "mlc-dev"
}

variable "aws_region" {
  description = "The AWS region to create things in."
  default     = "ap-southeast-2"
}

variable "iam_path" {
  default     = "/scheduled-processor/"
}

variable "production" {
  description = "Production Flag"
  default     = 0
}

variable "reporting_status_report_folder" {
  default     = "status_reports"
}

# ---------------------------------------------
# Cron Jobs

variable "cron_workflow_schedule" {
  default     = "rate(10 minutes)"
}

variable "cron_workflow_enable" {
  default     = false
}


# ---------------------------------------------
# Lambda 

variable "lambda_memory_usage" {
  description = "Lambda Memory Usage"
  default = "512"
}

variable "lambda_max_memory_usage" {
  description = "Lambda Max Memory Usage"
  default = "3008"
}

# ---------------------------------------------
# Timeouts

variable "external_timeout" {
  description = "API-exposed Timeout"
  default = 30
}

variable "internal_timeout" {
  description = "Internal timeouts such as Workflows"
  default = 120
}

variable "long_timeout" {
  description = "Long timeouts for background jobs"
  default = 300
}

variable "max_timeout" {
  description = "Max timeouts for background jobs"
  default = 900
}
