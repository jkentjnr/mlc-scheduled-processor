# DEV: AWS_PROFILE=mlc-dev S3_BUCKET=mlc-scheduled-processor-dropbox ./res/build.2.sh dev

echo ""
echo "Builder"
echo "---------------------------------------"

if [ -z "$1" ]
then
    echo "You must pass a terraform workspace to this script."
    exit 1
fi

if [ -z "$AWS_PROFILE" ]
then
    echo "You must pass an AWS_PROFILE to this script."
    exit 1
fi

if [ -z "$S3_BUCKET" ]
then
    echo "You must pass an S3_BUCKET to this script."
    exit 1
fi

echo "Workspace: $1"
echo "AWS Profile: $AWS_PROFILE"
echo "Staging / Data Upload S3 Bucket: $S3_BUCKET"
echo ""

npm run build
[ $? -eq 0 ] || exit 1
echo ""

serverless package --stage $1
[ $? -eq 0 ] || exit 1
echo ""

echo "Copy Build to AWS S3 Bucket"
aws s3 cp .serverless/default.zip s3://$S3_BUCKET/$1/lambda.zip --profile $AWS_PROFILE
[ $? -eq 0 ] || exit 1
echo ""

cd res/infrastructure

#AWS_PROFILE=$AWS_PROFILE terraform init
#[ $? -eq 0 ] || exit 1
#echo ""

#AWS_PROFILE=$AWS_PROFILE terraform apply -auto-approve -var-file="../../config/$1.tfvars.json"
terraform apply -var-file="../../config/$1.tfvars.json" -auto-approve
[ $? -eq 0 ] || exit 1
echo ""

exit 0