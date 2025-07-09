from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_anthropic import ChatAnthropic
from .state import AgentState
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from agents.web_search_agent import WebSearchAgent
from agents.notion_page_creation_agent import NotionPageCreationAgent
from agents.math_agent import MathFormulaAgent
from agents.structured_content_agent import StructuredContentAgent
from agents.diagram_maker_agent import DiagramMakerAgent
import logging

logger = logging.getLogger(__name__)

llm = ChatAnthropic(model="claude-3-5-sonnet-20240620", temperature=0)

# Define the routing prompt for the supervisor
supervisor_routing_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", """You are a highly intelligent routing agent for a multi-agent system.
        Your primary task is to analyze the user's request and determine which specialized agent should handle it as the *first* step.
        The goal is to eventually create a Notion page with the results, but your role is just to pick the initial content generation agent.

        Here are the available specialized agents and their capabilities:

        - `math_formula_agent`: Handles requests for generating mathematical formulas in formats like LaTeX or MathML.
            Example queries: "Generate the LaTeX for the Pythagorean theorem.", "What's the quadratic formula in MathML?", "Formula for kinetic energy."

        - `structured_content_agent`: Creates structured content suitable for Notion, such as tables, progress bars, or calendars.
            Example queries: "Create a Notion table for my grocery list.", "Generate a progress bar for project completion.", "Show me a calendar for July 2025."

        - `diagram_maker_agent`: Generates diagrams in formats like PlantUML, Mermaid, or Diagram.
            Example queries: "Draw a Mermaid sequence diagram for user login.", "Class diagram for a Python project in PlantUML.", "UML diagram for an e-commerce system."

        - `web_search_agent`: Conducts web searches and extracts content from specific URLs for general information gathering, current events, or research.
            Example queries: "Find the latest news on AI ethics.", "Summarize the history of quantum physics.", "Extract content from https://www.example.com/article."


        Your response MUST be one of the exact agent names listed above.
        If the request is ambiguous, choose the most likely initial step.
        If the request seems to explicitly ask for information that *only* web search can provide (e.g., current news, specific facts), choose `web_search_agent`.
        Do NOT choose `notion_page_creation_agent` as a direct initial step from the supervisor; it is a final output agent.

        Respond with ONLY the agent name, e.g., "web_search_agent". Do not include any other text, explanations, or punctuation.
        """),
        ("user", "{user_input}")
    ]
)

supervisor_router_chain = supervisor_routing_prompt | llm | StrOutputParser()
web_search_agent_instance = WebSearchAgent()
notion_page_creation_agent_instance = NotionPageCreationAgent()
math_formula_agent_instance = MathFormulaAgent()
structured_content_agent_instance = StructuredContentAgent()
diagram_maker_agent_instance = DiagramMakerAgent()

VALID_AGENTS = [
    "math_formula_agent",
    "structured_content_agent",
    "diagram_maker_agent",
    "web_search_agent"
]

# Track visited nodes in state to prevent infinite loops

def supervisor_agent_node(state: AgentState) -> Dict[str, Any]:
    """
    The supervisor node that decides which agent to call based on user_input.
    Adds a visited_nodes list to state to prevent recursion.
    """
    user_input = state["user_input"]
    visited_nodes = state.get("visited_nodes", [])
    logger.info(f"\n--- Supervisor: Received input: '{user_input}' ---")
    next_agent_name = supervisor_router_chain.invoke({"user_input": user_input}).strip().lower()
    if next_agent_name not in VALID_AGENTS:
        logger.warning(f"Supervisor Warning: LLM suggested '{next_agent_name}', which is not a valid initial agent. Defaulting to 'web_search_agent'.")
        next_agent_name = "web_search_agent"
    logger.info(f"--- Supervisor: Routing to '{next_agent_name}' ---")
    visited_nodes.append("supervisor")
    return {"current_agent": next_agent_name, "visited_nodes": visited_nodes}

# Agent node wrappers with robust state handling and logging
def call_web_search_agent(state: AgentState) -> Dict[str, Any]:
    logger.info(f"Entering WebSearchAgent node. User Input: {state['user_input']}")
    visited_nodes = state.get("visited_nodes", [])
    if "web_search_agent" in visited_nodes:
        logger.error("WebSearchAgent node revisited. Aborting to prevent recursion.")
        return {"agent_output": "[ERROR] Recursion detected in workflow. Aborting."}
    try:
        output = web_search_agent_instance.run(state["user_input"])
        if not output or output.strip() == "":
            return {"agent_output": "No content could be generated from web search. Please try a different query.", "visited_nodes": visited_nodes + ["web_search_agent"]}
        return {"agent_output": output, "visited_nodes": visited_nodes + ["web_search_agent"]}
    except Exception as e:
        logger.error(f"Error in WebSearchAgent: {e}")
        return {"agent_output": f"Error occurred during web search: {str(e)}", "visited_nodes": visited_nodes + ["web_search_agent"]}

def call_math_formula_agent(state: AgentState) -> Dict[str, Any]:
    logger.info(f"Entering MathFormulaAgent node. User Input: {state['user_input']}")
    visited_nodes = state.get("visited_nodes", [])
    if "math_formula_agent" in visited_nodes:
        logger.error("MathFormulaAgent node revisited. Aborting to prevent recursion.")
        return {"agent_output": "[ERROR] Recursion detected in workflow. Aborting."}
    try:
        output = math_formula_agent_instance.run(state["user_input"])
        if not output or output.strip() == "":
            return {"agent_output": "No mathematical formula could be generated from your input.", "visited_nodes": visited_nodes + ["math_formula_agent"]}
        return {"agent_output": output, "visited_nodes": visited_nodes + ["math_formula_agent"]}
    except Exception as e:
        logger.error(f"Error in MathFormulaAgent: {e}")
        return {"agent_output": f"Error occurred during math formula generation: {str(e)}", "visited_nodes": visited_nodes + ["math_formula_agent"]}

def call_structured_content_agent(state: AgentState) -> Dict[str, Any]:
    logger.info(f"Entering StructuredContentAgent node. User Input: {state['user_input']}")
    visited_nodes = state.get("visited_nodes", [])
    if "structured_content_agent" in visited_nodes:
        logger.error("StructuredContentAgent node revisited. Aborting to prevent recursion.")
        return {"agent_output": "[ERROR] Recursion detected in workflow. Aborting."}
    try:
        output = structured_content_agent_instance.run(state["user_input"])
        if not output or output.strip() == "":
            return {"agent_output": "No structured content could be generated from your input.", "visited_nodes": visited_nodes + ["structured_content_agent"]}
        return {"agent_output": output, "visited_nodes": visited_nodes + ["structured_content_agent"]}
    except Exception as e:
        logger.error(f"Error in StructuredContentAgent: {e}")
        return {"agent_output": f"Error occurred during structured content generation: {str(e)}", "visited_nodes": visited_nodes + ["structured_content_agent"]}

def call_diagram_maker_agent(state: AgentState) -> Dict[str, Any]:
    logger.info(f"Entering DiagramMakerAgent node. User Input: {state['user_input']}")
    visited_nodes = state.get("visited_nodes", [])
    if "diagram_maker_agent" in visited_nodes:
        logger.error("DiagramMakerAgent node revisited. Aborting to prevent recursion.")
        return {"agent_output": "[ERROR] Recursion detected in workflow. Aborting."}
    try:
        output = diagram_maker_agent_instance.run(state["user_input"])
        if not output or output.strip() == "":
            return {"agent_output": "No diagram could be generated from your input.", "visited_nodes": visited_nodes + ["diagram_maker_agent"]}
        return {"agent_output": output, "visited_nodes": visited_nodes + ["diagram_maker_agent"]}
    except Exception as e:
        logger.error(f"Error in DiagramMakerAgent: {e}")
        return {"agent_output": f"Error occurred during diagram generation: {str(e)}", "visited_nodes": visited_nodes + ["diagram_maker_agent"]}

def call_notion_page_creation_agent(state: AgentState) -> Dict[str, Any]:
    logger.info(f"Entering NotionPageCreationAgent node. Content to publish: {state.get('agent_output', '')[:100]}...")
    visited_nodes = state.get("visited_nodes", [])
    if "notion_page_creation_agent" in visited_nodes:
        logger.error("NotionPageCreationAgent node revisited. Aborting to prevent recursion.")
        return {"final_output": "[ERROR] Recursion detected in workflow. Aborting."}
    try:
        agent_output = state.get("agent_output", "")
        if not agent_output:
            return {"final_output": "No content available to create Notion page.", "visited_nodes": visited_nodes + ["notion_page_creation_agent"]}
        output = notion_page_creation_agent_instance.run(
            text_context=agent_output,
            user_query=state["user_input"]
        )
        return {"final_output": output, "visited_nodes": visited_nodes + ["notion_page_creation_agent"]}
    except Exception as e:
        logger.error(f"Error in NotionPageCreationAgent: {e}")
        return {"final_output": f"Error occurred during Notion page creation: {str(e)}", "visited_nodes": visited_nodes + ["notion_page_creation_agent"]}

# Define the conditional edge from the Supervisor
def route_next_agent(state: AgentState) -> str:
    """Routes to the agent specified in current_agent, or a fallback. Prevents infinite loops."""
    next_node = state.get("current_agent", "web_search_agent")
    visited_nodes = state.get("visited_nodes", [])
    if next_node not in VALID_AGENTS:
        logger.warning(f"Router Warning: Invalid node '{next_node}', defaulting to 'web_search_agent'")
        next_node = "web_search_agent"
    if next_node in visited_nodes:
        logger.error(f"Router detected revisit to node '{next_node}'. Aborting to prevent recursion.")
        return "web_search_agent"  # fallback, but will be caught by node guard
    logger.info(f"--- Router: Decided to move to node: {next_node} ---")
    return next_node

# --- Build the LangGraph Workflow ---
workflow = StateGraph(AgentState)
workflow.add_node("supervisor", supervisor_agent_node)
workflow.add_node("math_formula_agent", call_math_formula_agent)
workflow.add_node("structured_content_agent", call_structured_content_agent)
workflow.add_node("diagram_maker_agent", call_diagram_maker_agent)
workflow.add_node("web_search_agent", call_web_search_agent)
workflow.add_node("notion_page_creation_agent", call_notion_page_creation_agent)
workflow.set_entry_point("supervisor")
workflow.add_conditional_edges(
    "supervisor",
    route_next_agent,
    {
        "math_formula_agent": "math_formula_agent",
        "structured_content_agent": "structured_content_agent",
        "diagram_maker_agent": "diagram_maker_agent",
        "web_search_agent": "web_search_agent",
    }
)
workflow.add_edge("math_formula_agent", "notion_page_creation_agent")
workflow.add_edge("structured_content_agent", "notion_page_creation_agent")
workflow.add_edge("diagram_maker_agent", "notion_page_creation_agent")
workflow.add_edge("web_search_agent", "notion_page_creation_agent")
workflow.add_edge("notion_page_creation_agent", END)
langgraph_app = workflow.compile()