# Lambda Deployment Guide

This guide explains how to deploy the updated CenterPoint Energy Lambda function with CORS support.

## Updates Made

The `handler.py` has been updated to:

1. **Include CORS Headers** - All responses now include proper CORS headers for browser requests
2. **Handle HTTP Events** - Support for Lambda URL invocations with HTTP request/response format
3. **Better Error Handling** - Improved error responses with CORS headers
4. **Flexible Response Parsing** - Handles both direct and HTTP-wrapped responses

## Deployment Steps

### 1. Prepare the Lambda Package

```bash
# Navigate to the Lambda function directory
cd /workspaces/Center-Point-Energy-Front-End-Repo

# Create a new deployment package
mkdir lambda_package
cd lambda_package

# Copy the handler and dependencies (if you have a requirements.txt)
cp ../handler.py .

# If you have additional dependencies, install them:
# pip install -r requirements.txt -t .

# Create the deployment zip
zip -r ../lambda_function.zip .
cd ..
```

### 2. Update in AWS Console

**Option A: Using AWS Console (Recommended for quick testing)**

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find your Lambda function (likely named something like `ChatHandler` or `centerpoint-chat`)
3. Click "Code" tab
4. Either:
   - Upload the new `lambda_function.zip` via "Upload from" → ".zip file"
   - Or paste the updated `handler.py` content directly in the code editor
5. Click "Deploy"

**Option B: Using AWS CLI**

```bash
# Create deployment package
zip -j lambda_function.zip handler.py

# Update Lambda function code
aws lambda update-function-code \
  --function-name CenterPointChatHandler \
  --zip-file fileb://lambda_function.zip \
  --region eu-west-1
```

**Option C: Using SAM/CloudFormation**

If you have an IaC setup, update your template with the new function code.

### 3. Verify Lambda URL Configuration

1. In AWS Lambda Console, go to your function
2. Look for "Function URL" section (under Configuration)
3. Ensure the function URL exists and is enabled
4. The URL should look like: `https://grafqfo63yvndhsjgmi2f2cz2m0wewkz.lambda-url.eu-west-1.on.aws/`
5. Under "CORS", verify settings or ensure CORS is enabled for POST requests

### 4. Environment Variables

Ensure these environment variables are set in your Lambda function:

- `CHAT_HISTORY_TABLE` = `ChatHistoryTable` (or your DynamoDB table name)
- `KNOWLEDGE_BASE_ID` = `A5TU7SQXDU` (or your Bedrock Knowledge Base ID)
- `MODEL_ID` = `eu.anthropic.claude-haiku-4-5-20251001-v1:0` (or your model ARN)
- `MAX_TOKENS` = `4096` (or your preferred max tokens)

### 5. Verify IAM Permissions

The Lambda execution role needs these permissions:

- `dynamodb:GetItem`
- `dynamodb:PutItem`
- `dynamodb:UpdateItem`
- `bedrock:InvokeModel`
- `bedrock-agent-runtime:RetrieveAndGenerate`

Example IAM policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:eu-west-1:*:table/ChatHistoryTable"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock-agent-runtime:RetrieveAndGenerate"
      ],
      "Resource": "*"
    }
  ]
}
```

## Testing the Lambda

### 1. Using AWS Lambda Test Console

1. In the Lambda function page, click "Test"
2. Create a new test event with this payload:
```json
{
  "message": "Tell me about CenterPoint Energy",
  "customer_name": "CenterPoint"
}
```
3. Click "Test"
4. Check the response format and execution logs

### 2. Using cURL (from your local machine)

```bash
curl -X POST https://grafqfo63yvndhsjgmi2f2cz2m0wewkz.lambda-url.eu-west-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about CenterPoint",
    "customer_name": "CenterPoint"
  }'
```

### 3. Using the Web App

1. Start the app: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Send a message
4. Check browser console (F12 → Console) for detailed logs

## Troubleshooting

### "Failed to fetch" Error

This usually means CORS is not configured. Check:

1. Lambda function has CORS headers in response ✓ (Updated in handler)
2. Lambda URL is properly configured in AWS
3. Check browser console for the actual error details
4. Verify the Lambda URL is correct in `.env.local`

### CloudWatch Logs

Check Lambda execution logs in CloudWatch:

```bash
# View recent logs
aws logs tail /aws/lambda/CenterPointChatHandler --follow
```

### DynamoDB Issues

- Ensure the `ChatHistoryTable` exists
- Check table throughput/capacity
- Verify IAM permissions for the Lambda role

### Bedrock Issues

- Verify Knowledge Base ID is correct
- Check that your model is available in the region
- Ensure IAM permissions for Bedrock are set

## Frontend Configuration

The frontend (React app) is already configured to:

1. Send requests to the Lambda URL from `.env.local`
2. Handle both response formats (direct and HTTP-wrapped)
3. Maintain conversation history with `conversation_id`
4. Display CORS errors clearly to the user

## Next Steps

1. Deploy the updated `handler.py` to AWS Lambda
2. Test using cURL or the AWS console
3. Refresh the web app and test the chat
4. Check browser console for any remaining issues
5. Monitor CloudWatch logs for errors

## Support

If you encounter issues:

1. Check ALT cloudWatch logs for Lambda errors
2. Check browser console (F12) for frontend errors
3. Verify all environment variables are set correctly
4. Ensure IAM permissions are in place
5. Test the Lambda directly using cURL before testing via the web app
