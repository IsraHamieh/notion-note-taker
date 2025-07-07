from langgraph.prebuilt import create_react_agent
from langchain_tavily import TavilySearch
from langchain_core.tools import tool
from .prompts import DIAGRAM_MAKER_AGENT_PROMPT
import requests
import json

class DiagramMakerAgent:
    """
    An agent that generates diagrams (PlantUML, Diagram, Mermaid) from user input and context.
    Has access to tools to parse code repositories.
    """
    def __init__(self, model_name: str = "anthropic:claude-3-5-haiku-20241022", max_results: int = 2):
        self.model_name = model_name
        self.search_query_tool = TavilySearch(
            max_results=max_results,
            topic="general",
            include_images=True,
        )
        self.agent = self._create_agent()

    def _create_agent(self):
        return create_react_agent(
            model=self.model_name,
            tools=[self._parse_code_repository, self.search_query_tool],
            prompt=DIAGRAM_MAKER_AGENT_PROMPT
        )

    @tool
    def _parse_code_repository(self, repo_info: dict) -> str:
        """
        Parse a code repository on GitHub to extract structure, classes, and relationships for diagram generation.
        Args:
            repo_info: dict with keys 'owner', 'repo', 'path', 'token'.
        Returns:
            JSON string with parsed code structure or error message.
        """
        owner = repo_info.get('owner')
        repo = repo_info.get('repo')
        path = repo_info.get('path', '')
        token = repo_info.get('token')
        if not (owner and repo and token):
            return json.dumps({"error": "Missing required fields: owner, repo, or token."})
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
        headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        try:
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            # Only return structure, never the token
            return json.dumps({
                "repo": f"{owner}/{repo}",
                "path": path,
                "structure": response.json()
            })
        except Exception as e:
            return json.dumps({"error": str(e)})

    def run(self, text_context: str, user_input: str, diagram_type: str = "mermaid") -> str:
        """
        Run the diagram maker agent with context, user input, and diagram type.
        Args:
            text_context: Contextual information (e.g., code summary)
            user_input: User's request or description for the diagram
            diagram_type: Desired diagram format ('plantuml', 'diagram', 'mermaid')
        Returns:
            The agent's response as a string
        """
        combined_input = f"""
        Context: {text_context}
        
        User Input: {user_input}
        
        Diagram Type: {diagram_type}
        
        Please generate a diagram in the specified format using the context and user input.
        """
        response = ""
        for step in self.agent.stream(
            {"messages": combined_input},
            stream_mode="values",
        ):
            response = step["messages"][-1].content
        return response

    def run_streaming(self, text_context: str, user_input: str, diagram_type: str = "mermaid"):
        combined_input = f"""
        Context: {text_context}
        
        User Input: {user_input}
        
        Diagram Type: {diagram_type}
        
        Please generate a diagram in the specified format using the context and user input.
        """
        for step in self.agent.stream(
            {"messages": combined_input},
            stream_mode="values",
        ):
            yield step["messages"][-1] 