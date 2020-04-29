resource "aws_athena_database" "reporting" {
  name = replace(local.workspaceName, "-", "_")
  bucket = aws_s3_bucket.reporting-bucket.bucket
}

resource "aws_glue_catalog_table" "status-table" {
  database_name = aws_athena_database.reporting.name
  name          = "status"
  description   = "Scheduled Processing - Status Report Data"

  table_type    = "EXTERNAL_TABLE"

  parameters = {
    EXTERNAL    = "TRUE"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.reporting-bucket.bucket}/${var.reporting_status_report_folder}"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.IgnoreKeyTextOutputFormat"

    ser_de_info {
      name                  = "s3-stream"
      serialization_library = "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"

      parameters = {
        "serialization.format" = ","
        "field.delim" = ","
      }
    }

    columns {
      name = "policy_no"
      type = "string"
    }

    columns {
      name = "status"
      type = "string"
    }

    columns {
      name = "created_at"
      type = "timestamp"
    }

    columns {
      name = "updated_at"
      type = "timestamp"
    }

  }
}