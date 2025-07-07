# Notion Agent Backend

This is the backend for the Notion Agent application, which processes various file types and uses LangGraph to orchestrate multiple AI agents for creating Notion pages.

## Features

- **File Processing**: Supports PDF, DOCX, PPTX, XLSX, and image files
- **YouTube Processing**: Downloads and transcribes YouTube videos
- **Multi-Agent Orchestration**: Uses LangGraph to coordinate specialized agents:
  - Web Search Agent
  - Math Formula Agent
  - Structured Content Agent
  - Diagram Maker Agent
  - Notion Page Creation Agent
- **Ray Integration**: Scalable parallel processing
- **FastAPI**: Modern, fast web framework with automatic API documentation

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables (if needed):
```bash
export ANTHROPIC_API_KEY="your_anthropic_api_key"
export TAVILY_API_KEY="your_tavily_api_key"
```

3. Run the application:
```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

## API Endpoints

### Health Check
```
GET /api/health
```
Returns the health status of the application and Ray cluster.

### File Upload (Testing)
```
POST /api/upload
```
Simple file upload endpoint for testing purposes.

**Form Data:**
- `files`: List of files to upload

### Main Processing Endpoint
```
POST /api/process
```
Main endpoint for processing files and generating Notion content.

**Form Data:**
- `user_query` (required): The user's request for the Notion page
- `web_search_query` (optional): Additional web search query
- `use_image_content` (optional): Whether to extract text from images (true/false)
- `youtube_urls` (optional): JSON array of YouTube URLs
- `files` (optional): List of uploaded files

**Response:**
```json
{
  "success": true,
  "result": "Generated Notion page content",
  "processed_files": 2,
  "processed_youtube": 1,
  "content_preview": "Preview of aggregated content..."
}
```

## File Processing

The application supports the following file types:

- **PDF**: Text extraction using LlamaParse
- **DOCX**: Document content extraction
- **PPTX**: Presentation content extraction
- **XLSX**: Spreadsheet data extraction
- **Images**: Text extraction (if enabled) or direct file handling

## Agent Workflow

1. **Supervisor Agent**: Analyzes the user query and routes to the appropriate specialist agent
2. **Specialist Agents**: 
   - **Web Search Agent**: Conducts web searches and extracts content
   - **Math Formula Agent**: Generates mathematical formulas
   - **Structured Content Agent**: Creates Notion-compatible structured content
   - **Diagram Maker Agent**: Generates diagrams (PlantUML, Mermaid, etc.)
3. **Notion Page Creation Agent**: Creates the final Notion page with the specialist agent's output

## Testing

Run the test script to verify the application setup:

```bash
python test_app.py
```

This will test all endpoints and verify the application is working correctly.

## Development

### Running with Uvicorn (Development)
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 5000
```

### Running with Uvicorn (Production)
```bash
uvicorn app:app --host 0.0.0.0 --port 5000 --workers 4
```

## Architecture

```
Frontend → FastAPI → File Processing (Ray) → LangGraph → Specialist Agents → Notion Page
```

- **FastAPI**: Modern web framework for API endpoints with automatic documentation
- **Ray**: Distributed computing for file processing
- **LangGraph**: Agent orchestration and workflow management
- **LlamaParse**: Document parsing and text extraction
- **Anthropic Claude**: AI model for agent reasoning

## FastAPI Benefits

- **Automatic API Documentation**: Interactive docs at `/docs` and `/redoc`
- **Type Safety**: Built-in type checking and validation
- **Performance**: High-performance async framework
- **Modern Python**: Uses Python 3.6+ features and type hints
- **OpenAPI Standard**: Automatic OpenAPI/Swagger specification generation

## Error Handling

The application includes comprehensive error handling:
- File validation and type checking
- Processing error recovery
- HTTP status codes with meaningful error messages
- Temporary file cleanup

## Security

- File type validation
- File size limits (16MB max)
- Secure filename handling
- Temporary file cleanup
- CORS configuration for frontend integration 