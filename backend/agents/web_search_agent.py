from langchain_tavily import TavilySearch
from langgraph.prebuilt import create_react_agent
from langchain_anthropic import ChatAnthropic
import requests
from bs4 import BeautifulSoup
import json
from typing import List, Dict, Any
from langchain_core.tools import tool
import time
from .prompts import WEB_SEARCH_AGENT_PROMPT


class WebSearchAgent:
    """
    A web research agent that can search for information and extract content from URLs.
    """
    
    def __init__(self, model_name: str = "anthropic:claude-3-haiku-20240307", max_results: int = 2):
        """
        Initialize the WebSearchAgent.
        
        Args:
            model_name: The model to use for the agent
        """
        self.model_name = model_name
        self.search_query_tool = TavilySearch(
            max_results=max_results,
            topic="general",
            include_images=True,
        )
        self.agent = self._create_agent()
    
    def _create_agent(self):
        """Create the LangGraph agent with tools and prompt."""
        return create_react_agent(
            model=self.model_name,
            tools=[self._url_web_search, self.search_query_tool],
            prompt=WEB_SEARCH_AGENT_PROMPT
        )
    
    @tool
    def _url_web_search(self, urls: List[str], delay: float = 0.5) -> str:
        """
        Fetch and extract content from multiple URLs.
        
        Args:
            urls: List of URLs to fetch content from (can be JSON string or Python list)
            delay: Delay between requests in seconds to be respectful (default: 0.5)
        
        Returns:
            JSON string containing results for all URLs with content, titles, and metadata
        """
        # Handle both string and list inputs
        if isinstance(urls, str):
            try:
                urls = json.loads(urls)
            except json.JSONDecodeError:
                # If it's not valid JSON, treat as a single URL
                urls = [urls]
        
        if not isinstance(urls, list):
            return json.dumps({"error": "URLs must be provided as a list or JSON array string"})
        
        results = []
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        for i, url in enumerate(urls):
            if i > 0 and delay > 0:
                time.sleep(delay)  # Be respectful with requests
            
            try:
                # Validate URL
                if not url.startswith(('http://', 'https://')):
                    results.append({
                        "url": url,
                        "error": "Invalid URL format - must start with http:// or https://",
                        "status": "failed"
                    })
                    continue
                
                response = requests.get(url, headers=headers, timeout=15)
                response.raise_for_status()
                
                # Parse HTML content
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Remove script and style elements
                for script in soup(["script", "style", "nav", "footer", "aside"]):
                    script.decompose()
                
                # Extract title
                title = ""
                if soup.title:
                    title = soup.title.string.strip() if soup.title.string else ""
                
                # Extract main content
                text_content = soup.get_text()
                lines = (line.strip() for line in text_content.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                clean_text = ' '.join(chunk for chunk in chunks if chunk)
                
                # Limit content length but provide more than basic snippet
                content = clean_text[:8000] if len(clean_text) > 8000 else clean_text
                
                result = {
                    "url": url,
                    "title": title,
                    "content": content,
                    "content_length": len(clean_text),
                    "status": "success",
                    "status_code": response.status_code
                }
                
                # Extract meta description if available
                meta_desc = soup.find('meta', attrs={'name': 'description'})
                if meta_desc:
                    result["meta_description"] = meta_desc.get('content', '')
                
                results.append(result)
                
            except requests.exceptions.RequestException as e:
                results.append({
                    "url": url,
                    "error": f"Request failed: {str(e)}",
                    "status": "failed"
                })
            except Exception as e:
                results.append({
                    "url": url,
                    "error": f"Processing failed: {str(e)}",
                    "status": "failed"
                })
        
        # Summary statistics
        successful = sum(1 for r in results if r.get("status") == "success")
        failed = len(results) - successful
        
        response_data = {
            "results": results,
            "summary": {
                "total_urls": len(urls),
                "successful": successful,
                "failed": failed,
                "success_rate": f"{(successful/len(urls)*100):.1f}%" if urls else "0%"
            }
        }
        
        return json.dumps(response_data, indent=2, ensure_ascii=False)
    
    def run(self, user_input: str) -> str:
        """
        Run the web search agent with the given input.
        
        Args:
            user_input: The user's search query or request
            
        Returns:
            The agent's response as a string
        """
        response = ""
        for step in self.agent.stream(
            {"messages": user_input},
            stream_mode="values",
        ):
            response = step["messages"][-1].content
        
        return response
    
    def run_streaming(self, user_input: str):
        """
        Run the web search agent with streaming output.
        
        Args:
            user_input: The user's search query or request
            
        Yields:
            Each step of the agent's response
        """
        for step in self.agent.stream(
            {"messages": user_input},
            stream_mode="values",
        ):
            yield step["messages"][-1]
