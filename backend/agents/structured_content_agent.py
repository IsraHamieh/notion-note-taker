from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool
from prompts import STRUCTURED_CONTENT_AGENT_PROMPT

class StructuredContentAgent:
    def __init__(self, model_name="anthropic:claude-3-haiku-20240307"):
        self.agent = create_react_agent(
            model=model_name,
            tools=[],
            prompt=STRUCTURED_CONTENT_AGENT_PROMPT
        )

    def run(self, user_input: str) -> str:
        response = ""
        for step in self.agent.stream({"messages": user_input}, stream_mode="values"):
            response = step["messages"][-1].content
        return response