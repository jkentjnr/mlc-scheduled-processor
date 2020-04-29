# mlc-scheduled-processor
 
# Dependencies
- Install Nodejs
- Install terraform.io
- run `npm i -g serverless` to install Serverless framework
- run `npm install` to install dependencies

# Development Deployment
- Run `AWS_PROFILE=mlc-dev S3_BUCKET=mlc-scheduled-processor-dropbox ./res/build.sh dev` where your AWS CLI Profile is `mlc-dev` and Development Asset Sandbox is `mlc-scheduled-processor-dropbox`.