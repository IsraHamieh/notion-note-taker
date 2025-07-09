import ray
import os
import json
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from processing.tasks import process_files, process_youtube_videos
from graph.main_graph import langgraph_app
from typing import List, Optional, Tuple, Dict, Any
import uvicorn
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Constants
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'pptx', 'xlsx', 'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

# Initialize Ray
try:
    if not ray.is_initialized():
        ray.init(ignore_reinit_error=True)
        logger.info("Ray initialized successfully")
    else:
        logger.info("Ray already initialized")
except Exception as e:
    logger.error(f"Failed to initialize Ray: {e}")
    raise

# Initialize FastAPI app
app = FastAPI(title="Notion Agent API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO update this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_type(filename: str) -> str:
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

async def save_uploaded_file(file: UploadFile) -> str:
    """
    Safely save uploaded file to temporary location.
    Returns path to saved temporary file.
    """
    logger.info(f"Attempting to save file: {file.filename}")
    temp_path = Path(UPLOAD_FOLDER) / file.filename

    # Read ONCE
    content = await file.read()
    logger.info(f"Content: {content}")
    
    with open(temp_path, "wb") as f:
        f.write(content)
        
    logger.info(f"Successfully saved file {file.filename} to {temp_path}")
    return str(temp_path)
        

def cleanup_temp_files(temp_paths: List[str]) -> None:
    """
    Clean up temporary files.
    """
    for temp_path in temp_paths:
        try:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                logger.info(f"Cleaned up temporary file: {temp_path}")
        except Exception as e:
            logger.info(f"Failed to clean up temporary file {temp_path}: {e}")

class NotionAgentApp:
    """
    Main application class that orchestrates file processing and LangGraph workflow.
    """
    def __init__(self):
        self.langgraph_app = langgraph_app

    def process_uploaded_files(self, file_tuples: List[Tuple[str, str]], use_image_content: bool = False) -> List[Dict[str, Any]]:
        if not file_tuples:
            logger.info("No files provided for processing.")
            return []
        futures = []
        logger.info(f"Processing {len(file_tuples)} files...")
        for temp_path, filename in file_tuples:
            if not os.path.exists(temp_path):
                logger.error(f"File does not exist: {temp_path}")
                continue
            if not os.access(temp_path, os.R_OK):
                logger.error(f"File is not readable: {temp_path}")
                continue
            if allowed_file(filename):
                file_type = get_file_type(filename)
                logger.info(f"Processing {filename} as {file_type} with boolean {use_image_content}")
                future = process_files.remote(temp_path, file_type, use_image_content)
                futures.append(future)
            else:
                logger.info(f"File {filename} is not allowed and will be skipped.")
        if futures:
            try:
                results = ray.get(futures)
                logger.info(f"File processing completed: {len(results)} results")
                return results
            except Exception as e:
                logger.error(f"Error during file processing: {e}")
                return [{"error": str(e)}]
        else:
            logger.info("No valid files to process")
            return []

    def process_youtube_urls(self, youtube_urls: List[str]) -> List[Dict[str, Any]]:
        if not youtube_urls:
            logger.info("No YouTube URLs provided")
            return []
        try:
            logger.info(f"Processing {len(youtube_urls)} YouTube URLs")
            future = process_youtube_videos.remote(youtube_urls)
            results = ray.get([future])
            return results[0] if results else []
        except Exception as e:
            logger.error(f"Error processing YouTube URLs: {e}")
            return [{"error": str(e)}]

    def aggregate_content(self, file_results: List[Dict[str, Any]], youtube_results: List[Dict[str, Any]], web_search_query: Optional[str] = None) -> str:
        aggregated_parts = []
        for result in file_results:
            if isinstance(result, dict):
                if 'content' in result and result.get('parsed', True):
                    aggregated_parts.append(f"[File Content] {result['content']}")
                elif 'image_path' in result and not result.get('parsed', False):
                    aggregated_parts.append(f"[Image File] {result['image_path']}")
                elif 'error' in result:
                    aggregated_parts.append(f"[File Error] {result['error']}")
        for result in youtube_results:
            if isinstance(result, dict):
                if 'transcript' in result:
                    aggregated_parts.append(f"[YouTube Transcript] {result['transcript']}")
                elif 'error' in result:
                    aggregated_parts.append(f"[YouTube Error] {result['error']}")
        if web_search_query:
            aggregated_parts.append(f"[Web Search Query] {web_search_query}")
        return "\n\n".join(aggregated_parts)

    def run_langgraph_workflow(self, user_query: str, context: str = "") -> Dict[str, Any]:
        try:
            if context:
                full_input = f"Context from uploaded files:\n{context}\n\nUser Request: {user_query}"
            else:
                full_input = user_query
            logger.info(f"Running LangGraph workflow with input length: {len(full_input)}")
            # Defensive: set a lower recursion limit and catch recursion errors
            try:
                result = self.langgraph_app.invoke(
                    {"user_input": full_input},
                    config={"recursion_limit": 20}  # Lowered for safety
                )
            except RecursionError as re:
                logger.error(f"LangGraph recursion error: {re}")
                return {"success": False, "error": "Workflow recursion limit reached. Please try a simpler request.", "result": None}
            except Exception as e:
                logger.error(f"LangGraph workflow error: {e}")
                return {"success": False, "error": str(e), "result": None}
            logger.info("LangGraph workflow completed successfully")
            return {
                "success": True,
                "result": result.get("final_output", "No output generated"),
                "workflow_state": result
            }
        except Exception as e:
            logger.error(f"LangGraph workflow error (outer): {e}")
            return {"success": False, "error": str(e), "result": None}

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
    temp_paths: List[str] = []
    try:
        sources_list = json.loads(sources)
        web_search_queries_list = json.loads(web_search_queries)
        use_image_content_bool = use_image_content.lower() == "true"
        youtube_urls_list = [s['content'] for s in sources_list if s.get('type') == 'youtube']

        all_files = files + images
        file_tuples: List[Tuple[str, str]] = []
        for file in all_files:
            if not file or not file.filename:
                continue
            if allowed_file(file.filename):
                try:
                    temp_path = await save_uploaded_file(file)
                    temp_paths.append(temp_path)
                    file_tuples.append((temp_path, file.filename))
                except Exception as e:
                    return {"error": f"Failed to save uploaded file {file.filename}: {e}"}
            else:
                return {"error": f"File type not allowed: {file.filename}"}

        file_results = notion_app.process_uploaded_files(file_tuples, use_image_content_bool)
        file_errors = [f for f in file_results if isinstance(f, dict) and f.get('error')]
        youtube_results = notion_app.process_youtube_urls(youtube_urls_list)
        web_search_context = '\n'.join(web_search_queries_list) if web_search_queries_list else None
        aggregated_content = notion_app.aggregate_content(
            file_results, youtube_results, web_search_context
        )
        langgraph_result = notion_app.run_langgraph_workflow(user_query, aggregated_content)
        cleanup_temp_files(temp_paths)
        return {
            "file_results": file_results,
            "youtube_results": youtube_results,
            "aggregated_content": aggregated_content,
            "langgraph_result": langgraph_result,
            "file_errors": file_errors
        }
    except Exception as e:
        cleanup_temp_files(temp_paths)
        return {"error": str(e)}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "ray_status": ray.is_initialized(),
        "api": "FastAPI"
    }

@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    try:
        uploaded_files = []
        
        logger.info(f"Upload endpoint received {len(files)} files")
        
        for file in files:
            if not file or not file.filename:
                logger.info("Received None file or file with no filename")
                continue
                
            logger.info(f"Processing upload file: {file.filename}")
            
            if allowed_file(file.filename):
                filename = file.filename
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                
                try:
                    # Read file content
                    content = await file.read()
                    if not content:
                        logger.info(f"File {filename} is empty")
                        continue
                    
                    # Write to file
                    with open(file_path, "wb") as buffer:
                        buffer.write(content)
                    
                    file_size = os.path.getsize(file_path)
                    logger.info(f"Successfully uploaded {filename} (size: {file_size} bytes)")
                    
                    uploaded_files.append({
                        "filename": filename,
                        "path": file_path,
                        "size": file_size
                    })
                    
                except Exception as e:
                    logger.error(f"Error processing upload file {filename}: {e}")
                    continue
            else:
                logger.info(f"File type not allowed: {file.filename}")
        
        return {
            "success": True,
            "uploaded_files": uploaded_files
        }
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)