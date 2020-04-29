resource "aws_s3_bucket" "reporting-bucket" {
  bucket = "${var.name}-${terraform.workspace}"
  acl    = "private"
  region = var.aws_region

  versioning {
    enabled = true
  }

  lifecycle_rule {
    id      = "${var.name}-${terraform.workspace}-reporting-lifecycle"
    enabled = true

    transition {
      days          = 120
      storage_class = "STANDARD_IA"
    }

    noncurrent_version_transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    noncurrent_version_transition {
      days          = 60
      storage_class = "GLACIER"
    }

    noncurrent_version_expiration {
      days = 90
    }
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.app-key.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }

  tags = {
    STAGE = terraform.workspace
  }
}

resource "aws_s3_bucket_public_access_block" "reporting-bucket-access-block" {
  bucket = aws_s3_bucket.reporting-bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
