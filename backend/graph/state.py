from typing import TypedDict, Annotated, List, Dict, Any
import operator
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage

class AgentState(TypedDict):
    """
    Represents the state of our graph.
    """
    user_input: str  # The initial input from the user
    current_agent: str # The name of the agent chosen by the supervisor
    agent_output: Annotated[str, operator.add] # The output from the last executed specialized agent.
    final_output: str # The ultimate output after Notion page creation