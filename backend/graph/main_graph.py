from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_anthropic import ChatAnthropic
from state import AgentState
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from agents.web_search_agent import WebSearchAgent
from agents.notion_page_creation_agent import NotionPageCreationAgent
from agents.math_agent import MathFormulaAgent
from agents.structured_content_agent import StructuredContentAgent
from agents.diagram_maker_agent import DiagramMakerAgent


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

# Create the routing chain for the supervisor
supervisor_router_chain = supervisor_routing_prompt | llm | StrOutputParser()
web_search_agent_instance = WebSearchAgent()
notion_page_creation_agent_instance = NotionPageCreationAgent()
math_formula_agent_instance = MathFormulaAgent()
structured_content_agent_instance = StructuredContentAgent()
diagram_maker_agent_instance = DiagramMakerAgent()

def supervisor_agent_node(state: AgentState) -> Dict[str, Any]:
    """
    The supervisor node that decides which agent to call based on user_input.
    """
    user_input = state["user_input"]
    print(f"\n--- Supervisor: Received input: '{user_input}' ---")
    
    # Invoke the LLM to get the next agent name
    next_agent_name = supervisor_router_chain.invoke({"user_input": user_input}).strip().lower() # Ensure clean output

    # Validate and fallback for robustness
    valid_agents = ["math_agent", "structured_content_agent", "diagram_maker_agent",
                    "web_search_agent"]
    if next_agent_name not in valid_agents:
        print(f"Supervisor Warning: LLM suggested '{next_agent_name}', which is not a valid initial agent. Defaulting to 'web_search_agent'.")
        next_agent_name = "web_search_agent" # Fallback

    print(f"--- Supervisor: Routing to '{next_agent_name}' ---")
    return {"current_agent": next_agent_name}





# These functions take the graph state and call the agent instance's `run` method
# They must return a dict that updates the state (e.g., `agent_output`).

def call_web_search_agent(state: AgentState) -> Dict[str, Any]:
    print(f"Entering WebSearchAgent node. User Input: {state['user_input']}")
    output = web_search_agent_instance.run(state["user_input"])
    return {"agent_output": output}

def call_math_formula_agent(state: AgentState) -> Dict[str, Any]:
    print(f"Entering MathFormulaAgent node. User Input: {state['user_input']}")
    output = math_formula_agent_instance.run(state["user_input"])
    return {"agent_output": output}

def call_structured_content_agent(state: AgentState) -> Dict[str, Any]:
    print(f"Entering StructuredContentAgent node. User Input: {state['user_input']}")
    output = structured_content_agent_instance.run(state["user_input"])
    return {"agent_output": output}

def call_diagram_maker_agent(state: AgentState) -> Dict[str, Any]:
    print(f"Entering DiagramMakerAgent node. User Input: {state['user_input']}")
    output = diagram_maker_agent_instance.run(state["user_input"])
    return {"agent_output": output}

def call_notion_page_creation_agent(state: AgentState) -> Dict[str, Any]:
    print(f"Entering NotionPageCreationAgent node. Content to publish: {state['agent_output'][:100]}...")
    # The Notion agent needs the content from the previous specialized agent
    # and potentially the original query for context/title.
    output = notion_page_creation_agent_instance.run(
        content_to_publish=state["agent_output"],
        original_query=state["user_input"]
    )
    return {"final_output": output}

# Define the conditional edge from the Supervisor
# This function uses the 'current_agent' state to route
def route_next_agent(state: AgentState) -> str:
    """Routes to the agent specified in current_agent, or a fallback."""
    next_node = state["current_agent"]
    print(f"--- Router: Decided to move to node: {next_node} ---")
    return next_node


# --- Build the LangGraph Workflow ---
workflow = StateGraph(AgentState)

# Add nodes for each agent. Use descriptive names that match what the supervisor will return.
workflow.add_node("supervisor", supervisor_agent_node)
workflow.add_node("math_formula_agent", call_math_formula_agent)
workflow.add_node("structured_content_agent", call_structured_content_agent)
workflow.add_node("diagram_maker_agent", call_diagram_maker_agent)
workflow.add_node("web_search_agent", call_web_search_agent)
workflow.add_node("notion_page_creation_agent", call_notion_page_creation_agent)


# Set the entry point (UserInput goes to SupervisorAgent)
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

# Define edges from specialized agents to NotionPageCreationAgent
# Once a specialized agent finishes, its output goes to the Notion creation agent.
workflow.add_edge("math_formula_agent", "notion_page_creation_agent")
workflow.add_edge("structured_content_agent", "notion_page_creation_agent")
workflow.add_edge("diagram_maker_agent", "notion_page_creation_agent")
workflow.add_edge("web_search_agent", "notion_page_creation_agent")


# The NotionPageCreationAgent is the final step, leading to END
workflow.add_edge("notion_page_creation_agent", END)


# Compile the graph
langgraph_app = workflow.compile()