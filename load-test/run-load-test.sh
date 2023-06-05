##Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
##SPDX-License-Identifier: MIT-0

STACK_NAME=AwsShopBEStack

API_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiURL`].OutputValue' \
  --output text)

echo $API_URL

ROOT_FOLDER=$(pwd)

artillery run "$ROOT_FOLDER/load-test/load-test2.yml" --target "$API_URL"