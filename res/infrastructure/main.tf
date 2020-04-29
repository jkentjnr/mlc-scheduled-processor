provider "aws" {
    profile =                   var.aws_profile
    region =                    var.aws_region
    shared_credentials_file =   "~/.aws/credentials"
}

data "aws_caller_identity" "current" {
  
}