import os
import json
import uuid
import boto3
from datetime import datetime

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
bedrock_runtime = boto3.client('bedrock-runtime')
kb_client = boto3.client('bedrock-agent-runtime')

# Environment variables
CHAT_HISTORY_TABLE = os.environ.get('CHAT_HISTORY_TABLE', 'ChatHistoryTable')
KNOWLEDGE_BASE_ID = os.environ.get('KNOWLEDGE_BASE_ID', 'A5TU7SQXDU')
MODEL_ID = os.environ.get('MODEL_ID', 'eu.anthropic.claude-haiku-4-5-20251001-v1:0')
MAX_TOKENS = int(os.environ.get('MAX_TOKENS', '4096'))

# Initialize DynamoDB table
chat_history_table = dynamodb.Table(CHAT_HISTORY_TABLE)

def lambda_handler(event, context):
    """
    Direct Lambda handler for chat messages.
    Expected event format:
    {
        "message": "user message text",
        "conversation_id": "uuid-string"  # optional, creates new conversation if not provided
    }
    """
    
    # CORS headers for browser requests
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle CORS preflight requests
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': ''
        }
    
    try:
        # Handle both direct invocation and HTTP events
        body = event
        if 'body' in event:
            if isinstance(event['body'], str):
                body = json.loads(event['body'])
            else:
                body = event['body']
        
        user_message = body.get('message')
        conversation_id = body.get('conversation_id')
        customer_name = body.get('customer_name', 'CenterPoint')

        if not user_message:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'message is required'})
            }
        
        # Create new conversation if no conversation_id provided
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()
            
            chat_history_table.put_item(
                Item={
                    'conversation_id': conversation_id,
                    'created_at': timestamp,
                    'updated_at': timestamp,
                    'messages': []
                }
            )
        
        # Get existing conversation
        response = chat_history_table.get_item(
            Key={'conversation_id': conversation_id}
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Conversation not found'})
            }
        
        conversation = response['Item']
        messages = conversation.get('messages', [])
        
        # Add user message to conversation
        timestamp = datetime.now().isoformat()
        user_message_obj = {
            'role': 'user',
            'content': user_message,
            'timestamp': timestamp
        }
        messages.append(user_message_obj)
        
        # Format messages for Bedrock
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                'role': msg['role'],
                'content': [{'text': msg['content']}]
            })

        # Query the knowledge base with Bedrock
        ai_response = query_knowledge_base(user_message, formatted_messages, customer_name)
        
        # Add AI response to conversation
        ai_message_obj = {
            'role': 'assistant',
            'content': ai_response,
            'timestamp': datetime.now().isoformat()
        }
        messages.append(ai_message_obj)
        
        # Update the conversation in DynamoDB
        chat_history_table.update_item(
            Key={'conversation_id': conversation_id},
            UpdateExpression='SET messages = :messages, updated_at = :updated_at',
            ExpressionAttributeValues={
                ':messages': messages,
                ':updated_at': datetime.now().isoformat()
            }
        )
        
        response_body = {
            'statusCode': 200,
            'conversation_id': conversation_id,
            'message': ai_message_obj
        }
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        error_response = {
            'statusCode': 500,
            'error': f'Internal server error: {str(e)}'
        }
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps(error_response)
        }

def query_knowledge_base(query, conversation_history, customer_name):
    """
    Query the Bedrock Knowledge Base and get a response from the model.
    Automatically include relevant links from the knowledge base.
    """
    try:
        enhanced_query = f"""
        {query}
        
        Please provide a comprehensive response that:
            - Provide responses as if you're a helpful WhatsApp customer service representative of {customer_name} called {customer_name} AI.
            - Provide direct, detailed and helpful answers with a friendly tone. Avoid words like "retrieved results", "search results", "based on the information", or "knowledge base".
            - Includes ALL relevant details from the knowledge base.
            - If the question is unrelated to {customer_name}'s services or policies, respond with exactly this message: "I'm a chat application designed to answer only questions related to {customer_name}. Please ask a question related to {customer_name}'s services, or policies."
            - If the user's question is unrelated to {customer_name}, DO NOT include any links.
            - Separate major sections with a blank line to improve readability. 
            - Do not include '## Answer' in the response, use a relevant heading instead.
            - CRITICAL - Every answer should include at least two webpage links that relate to the question, if applicable.
            - CRITICAL - Includes specific webpage links at the end of the content, without needing to be asked. 
        """
        
        # kb_response = kb_client.retrieve_and_generate(
        #     input={
        #         'text': enhanced_query
        #     },
        #     retrieveAndGenerateConfiguration={
        #         'knowledgeBaseConfiguration': {
        #             'knowledgeBaseId': KNOWLEDGE_BASE_ID,
        #             'modelArn': MODEL_ID
        #         },
        #         'type': 'KNOWLEDGE_BASE'
        #     }
        # )

        retrieval_config = {
            'vectorSearchConfiguration': {
                'numberOfResults': 5,
                'filter': {
                    'equals': {
                        'key': 'customer',
                        'value': customer_name   
                    }
                }
            }
        }
        
        kb_response = kb_client.retrieve_and_generate(
            input={'text': enhanced_query},
            retrieveAndGenerateConfiguration={
                'knowledgeBaseConfiguration': {
                    'knowledgeBaseId': KNOWLEDGE_BASE_ID,
                    'modelArn': MODEL_ID,
                    'retrievalConfiguration': retrieval_config
                },
                'type': 'KNOWLEDGE_BASE'
            }
        )
        
        response_text = kb_response.get('output', {}).get('text', '')
        
        fallback_message = f"I'm a chat application designed to answer only questions related to {customer_name}. Please ask a question related to {customer_name}'s services or policies."

        if (
            not response_text 
            or "unable to assist" in response_text.lower() 
            or "the model could not find any information" in response_text.lower()
        ):
            return fallback_message
        else:
            return response_text
            
    except Exception as e:
        print(f"Error in knowledge base query: {str(e)}")
        raise e