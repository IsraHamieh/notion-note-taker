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


LANGCHAIN_API_KEY = os.environ.get('LANGCHAIN_API_KEY')

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
            # Run the LangGraph workflow 
            result = self.langgraph_app.invoke({
                "user_input": full_input
            })
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
    notion_object: str = Form(...),
    notion_id: str = Form(...),
    sources: str = Form("[]"),
    web_search_queries: str = Form("[]"),
    use_image_content: str = Form("false"),
    files: List[UploadFile] = File([]),
    images: List[UploadFile] = File([])
):
    print("[app.py] /api/process called")
    try:
        sources_list = json.loads(sources)
        web_search_queries_list = json.loads(web_search_queries)
        use_image_content_bool = use_image_content.lower() == "true"
        youtube_urls_list = [s['content'] for s in sources_list if s.get('type') == 'youtube']
        print(f"Processing request: {user_query}")
        print(f"Notion object: {notion_object}, Notion id: {notion_id}")
        print(f"Sources: {sources_list}")
        print(f"Web search queries: {web_search_queries_list}")
        print(f"Files: {len(files)}, Images: {len(images)}")
        print(f"YouTube URLs: {youtube_urls_list}")
        print(f"Use image content: {use_image_content_bool}")
        all_files = files + images
        file_results = notion_app.process_uploaded_files(all_files, use_image_content_bool)
        print(f"File processing completed: {len(file_results)} results")
        # Check for file processing errors
        file_errors = [f for f in file_results if isinstance(f, dict) and f.get('error')]
        if file_errors:
            print(f"File processing errors: {file_errors}")
            raise HTTPException(status_code=400, detail="One or more files could not be processed. Please check your files and try again.")
        youtube_results = notion_app.process_youtube_urls(youtube_urls_list)
        print(f"YouTube processing completed: {len(youtube_results)} results")
        web_search_context = '\n'.join(web_search_queries_list) if web_search_queries_list else None
        aggregated_content = notion_app.aggregate_content(
            file_results, youtube_results, web_search_context
        )
        print(f"Aggregated content length: {len(aggregated_content)}")
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
            # Check for overloaded or external API errors
            error_msg = str(langgraph_result["error"])
            print(f"LangGraph error: {error_msg}")
            if 'overloaded' in error_msg.lower():
                raise HTTPException(status_code=503, detail="The AI service is currently overloaded. Please try again in a few minutes.")
            raise HTTPException(status_code=500, detail="An error occurred while generating your notes. Please try again later.")
    except HTTPException as e:
        # Already user-friendly
        raise e
    except Exception as e:
        print(f"Error in process_and_generate: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again later.")

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001) 