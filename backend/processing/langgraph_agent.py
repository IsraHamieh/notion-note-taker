import os

def run_langgraph_agent(aggregated_text: str) -> str:
    # Here you would call your LangGraph agent with the aggregated text
    # For now, just echo the input for demonstration
    return f"LangGraph agent received: {aggregated_text[:100]}..." 