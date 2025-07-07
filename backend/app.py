import ray
import os
import json
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from processing.tasks import process_files, process_youtube_videos
from graph.main_graph import langgraph_app
import tempfile
from typing import List, Optional
import uvicorn
import boto3
from botocore.exceptions import ClientError
from cryptography.fernet import Fernet
import base64
from uuid import uuid4
from datetime import datetime
# LangSmith (LangChain tracing) integration
from langchain.callbacks.tracers.langchain import LangChainTracerV2
from langchain.callbacks.tracers.run_collector import RunCollectorCallbackHandler

# Initialize Ray
ray.init(ignore_reinit_error=True)

# Initialize FastAPI app
app = FastAPI(title="Notion Agent API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'pptx', 'xlsx', 'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# DynamoDB setup
DYNAMODB_TABLE = os.environ.get('DYNAMODB_KEYS_TABLE', 'notion_agent_user_keys')
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
keys_table = dynamodb.Table(DYNAMODB_TABLE)

# Encryption setup (for demo, use Fernet; in prod, use AWS KMS)
FERNET_KEY = os.environ.get('FERNET_KEY') or Fernet.generate_key().decode()
fernet = Fernet(FERNET_KEY.encode())

def encrypt_value(value: str) -> str:
    return fernet.encrypt(value.encode()).decode()

def decrypt_value(value: str) -> str:
    return fernet.decrypt(value.encode()).decode()

# TODO Dummy JWT auth dependency (replace with real auth)
def get_current_user_id(request: Request) -> str:
    # In production, extract user_id from JWT in request.headers['Authorization']
    # Here, use a placeholder for demo
    return request.headers.get('X-User-Id', 'demo-user')

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_type(filename):
    """Determine file type from filename."""
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in ['png', 'jpg', 'jpeg']:
        return 'image'
    elif ext == 'pdf':
        return 'pdf'
    elif ext == 'docx':
        return 'docx'
    elif ext == 'pptx':
        return 'pptx'
    elif ext == 'xlsx':
        return 'xlsx'
    else:
        return 'unknown'

# DynamoDB chat table setup
DYNAMODB_CHAT_TABLE = os.environ.get('DYNAMODB_CHAT_TABLE', 'notion_agent_chats')
chat_table = dynamodb.Table(DYNAMODB_CHAT_TABLE)

# Set up LangSmith tracing if enabled
LANGCHAIN_TRACING_V2 = os.environ.get('LANGCHAIN_TRACING_V2', 'false').lower() == 'true'
LANGCHAIN_API_KEY = os.environ.get('LANGCHAIN_API_KEY')
tracer = None
if LANGCHAIN_TRACING_V2 and LANGCHAIN_API_KEY:
    tracer = LangChainTracerV2(api_url=os.environ.get('LANGCHAIN_ENDPOINT', 'https://api.smith.langchain.com'),
                               api_key=LANGCHAIN_API_KEY)

class NotionAgentApp:
    """
    Main application class that orchestrates file processing and LangGraph workflow.
    """
    
    def __init__(self):
        """Initialize the application."""
        self.langgraph_app = langgraph_app
    
    def process_uploaded_files(self, files: List[UploadFile], use_image_content: bool = False):
        """
        Process uploaded files using Ray for parallel processing.
        
        Args:
            files: List of uploaded file objects
            use_image_content: Whether to extract text content from images
            
        Returns:
            List of processed file results
        """
        if not files:
            return []
        
        futures = []
        temp_files = []
        
        try:
            for file in files:
                if file and allowed_file(file.filename):
                    # Save file to temporary location
                    filename = file.filename
                    temp_path = os.path.join(tempfile.gettempdir(), filename)
                    
                    # Save uploaded file to temp location
                    with open(temp_path, "wb") as buffer:
                        content = file.file.read()
                        buffer.write(content)
                    
                    temp_files.append(temp_path)
                    
                    # Determine file type
                    file_type = get_file_type(filename)
                    
                    # Submit processing task
                    future = process_files.remote(temp_path, file_type, use_image_content)
                    futures.append(future)
            
            # Wait for all processing to complete
            results = ray.get(futures) if futures else []
            
            return results
            
        finally:
            # Clean up temporary files
            for temp_file in temp_files:
                try:
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                except Exception as e:
                    print(f"Error cleaning up {temp_file}: {e}")
    
    def process_youtube_urls(self, youtube_urls: List[str]):
        """
        Process YouTube URLs using Ray.
        
        Args:
            youtube_urls: List of YouTube URLs
            
        Returns:
            List of processed YouTube results
        """
        if not youtube_urls:
            return []
        
        try:
            future = process_youtube_videos.remote(youtube_urls)
            results = ray.get([future])
            return results[0] if results else []
        except Exception as e:
            print(f"Error processing YouTube URLs: {e}")
            return []
    
    def aggregate_content(self, file_results, youtube_results, web_search_query: Optional[str] = None):
        """
        Aggregate content from all sources.
        
        Args:
            file_results: Results from file processing
            youtube_results: Results from YouTube processing
            web_search_query: Optional web search query
            
        Returns:
            Aggregated text content
        """
        aggregated_parts = []
        
        # Process file results
        for result in file_results:
            if isinstance(result, dict):
                if 'content' in result and result.get('parsed', True):
                    aggregated_parts.append(f"[File Content] {result['content']}")
                elif 'image_path' in result and not result.get('parsed', False):
                    aggregated_parts.append(f"[Image File] {result['image_path']}")
                elif 'error' in result:
                    aggregated_parts.append(f"[File Error] {result['error']}")
        
        # Process YouTube results
        for result in youtube_results:
            if isinstance(result, dict):
                if 'transcript' in result:
                    aggregated_parts.append(f"[YouTube Transcript] {result['transcript']}")
                elif 'error' in result:
                    aggregated_parts.append(f"[YouTube Error] {result['error']}")
        
        # Add web search query if provided
        if web_search_query:
            aggregated_parts.append(f"[Web Search Query] {web_search_query}")
        
        return "\n\n".join(aggregated_parts)
    
    def run_langgraph_workflow(self, user_query: str, context: str = ""):
        """
        Run the LangGraph workflow with user query and context.
        Adds LangSmith tracing if enabled.
        """
        try:
            # Prepare the input for LangGraph
            if context:
                full_input = f"Context from uploaded files:\n{context}\n\nUser Request: {user_query}"
            else:
                full_input = user_query
            # Add LangSmith tracing if enabled
            callbacks = [tracer] if tracer else None
            # Run the LangGraph workflow with tracing
            result = self.langgraph_app.invoke({
                "user_input": full_input
            }, callbacks=callbacks)
            return {
                "success": True,
                "result": result.get("final_output", "No output generated"),
                "workflow_state": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "result": None
            }

# Initialize the app instance
notion_app = NotionAgentApp()

@app.post("/api/process")
async def process_and_generate(
    user_query: str = Form(...),
    web_search_query: Optional[str] = Form(""),
    use_image_content: bool = Form(False),
    youtube_urls: str = Form("[]"),
    files: List[UploadFile] = File([])
):
    """
    Main endpoint for processing files and generating Notion content.
    
    Args:
        user_query: The user's request for the Notion page
        web_search_query: Additional web search query (optional)
        use_image_content: Whether to extract text from images
        youtube_urls: JSON array of YouTube URLs
        files: List of uploaded files
    """
    try:
        # Parse JSON strings
        youtube_urls_list = json.loads(youtube_urls)
        
        print(f"Processing request: {user_query}")
        print(f"Files: {len(files)}")
        print(f"YouTube URLs: {len(youtube_urls_list)}")
        print(f"Use image content: {use_image_content}")
        
        # Process files
        file_results = notion_app.process_uploaded_files(files, use_image_content)
        print(f"File processing completed: {len(file_results)} results")
        
        # Process YouTube URLs
        youtube_results = notion_app.process_youtube_urls(youtube_urls_list)
        print(f"YouTube processing completed: {len(youtube_results)} results")
        
        # Aggregate content
        aggregated_content = notion_app.aggregate_content(
            file_results, youtube_results, web_search_query
        )
        print(f"Aggregated content length: {len(aggregated_content)}")
        
        # Run LangGraph workflow
        langgraph_result = notion_app.run_langgraph_workflow(user_query, aggregated_content)
        
        if langgraph_result["success"]:
            return {
                "success": True,
                "result": langgraph_result["result"],
                "processed_files": len(file_results),
                "processed_youtube": len(youtube_results),
                "content_preview": aggregated_content[:500] + "..." if len(aggregated_content) > 500 else aggregated_content
            }
        else:
            raise HTTPException(status_code=500, detail=langgraph_result["error"])
            
    except Exception as e:
        print(f"Error in process_and_generate: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy", 
        "ray_status": ray.is_initialized(),
        "api": "FastAPI"
    }

@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Simple file upload endpoint for testing.
    """
    try:
        uploaded_files = []
        
        for file in files:
            if file and allowed_file(file.filename):
                filename = file.filename
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                
                # Save uploaded file
                with open(file_path, "wb") as buffer:
                    content = file.file.read()
                    buffer.write(content)
                
                uploaded_files.append({
                    "filename": filename,
                    "path": file_path,
                    "size": os.path.getsize(file_path)
                })
        
        return {
            "success": True,
            "uploaded_files": uploaded_files
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/keys")
async def save_api_keys(keys: dict, user_id: str = Depends(get_current_user_id)):
    """
    Save API/integration keys for the authenticated user. Keys are encrypted at rest.
    Do NOT return keys in the response.
    """
    try:
        encrypted_keys = {k: encrypt_value(v) for k, v in keys.items() if v}
        keys_table.put_item(
            Item={
                'user_id': user_id,
                'keys': encrypted_keys
            }
        )
        return {"success": True, "message": "Keys saved securely."}
    except ClientError as e:
        return {"success": False, "error": str(e)}

@app.get("/api/keys")
async def get_api_keys(user_id: str = Depends(get_current_user_id)):
    """
    Retrieve API keys for backend use only (not exposed to frontend after save).
    """
    try:
        resp = keys_table.get_item(Key={'user_id': user_id})
        if 'Item' not in resp:
            return {"keys": {}}
        encrypted_keys = resp['Item'].get('keys', {})
        decrypted_keys = {k: decrypt_value(v) for k, v in encrypted_keys.items()}
        return {"keys": decrypted_keys}
    except ClientError as e:
        return {"error": str(e)}

@app.post("/api/chats")
async def save_chat(
    chat: dict,  # expects {prompt, files, response}
    user_id: str = Depends(get_current_user_id)
):
    """
    Save a chat (prompt, files metadata, response, timestamp) for the authenticated user.
    """
    try:
        chat_id = str(uuid4())
        item = {
            'chat_id': chat_id,
            'user_id': user_id,
            'prompt': chat.get('prompt', ''),
            'files': chat.get('files', []),  # list of file metadata/links
            'response': chat.get('response', ''),
            'timestamp': datetime.utcnow().isoformat()
        }
        chat_table.put_item(Item=item)
        return {"success": True, "chat_id": chat_id}
    except ClientError as e:
        return {"success": False, "error": str(e)}

@app.get("/api/chats")
async def list_chats(user_id: str = Depends(get_current_user_id)):
    """
    List all chats for the authenticated user (metadata only).
    """
    try:
        resp = chat_table.query(
            IndexName='user_id-timestamp-index',
            KeyConditionExpression='user_id = :uid',
            ExpressionAttributeValues={':uid': user_id},
            ProjectionExpression='chat_id, prompt, timestamp'
        )
        return {"chats": resp.get('Items', [])}
    except ClientError as e:
        return {"error": str(e)}

@app.get("/api/chats/{chat_id}")
async def get_chat(chat_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Get a full chat (prompt, files, response) by chat_id for the authenticated user.
    """
    try:
        resp = chat_table.get_item(Key={'chat_id': chat_id, 'user_id': user_id})
        if 'Item' not in resp:
            return {"error": "Chat not found"}
        return resp['Item']
    except ClientError as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000) 