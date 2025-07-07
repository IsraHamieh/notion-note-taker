from langchain_core.tools import tool
import os
import json
import requests
import logging
from langgraph.prebuilt import create_react_agent
from .prompts import NOTION_PAGE_CREATION_AGENT_PROMPT

logging.basicConfig()


class NotionPageCreationAgent:
    """
    An agent specialized in creating Notion pages using the Notion API.
    """
    
    def __init__(self, model_name: str = "anthropic:claude-3-7-sonnet-latest"):
        """
        Initialize the NotionPageCreationAgent.
        
        Args:
            model_name: The model to use for the agent
        """
        self.model_name = model_name
        self.agent = self._create_agent()
    
    def _create_agent(self):
        """Create the LangGraph agent with tools and prompt."""
        return create_react_agent(
            model=self.model_name,
            tools=[self._create_notion_page],
            prompt=NOTION_PAGE_CREATION_AGENT_PROMPT
        )
    
    @tool
    def _create_notion_page(self, command_content: str) -> str:
        """
        Call Notion Create Page API.
        Automatically replaces '${NOTION_PAGE_ID}' and '${NOTION_DATABASE_ID}'
        placeholders in the command_content with actual environment variable values.
        Returns a success message or an error message string.
        """
        logging.info(f"create_notion_page tool called.")

        notion_api_key = os.environ.get('NOTION_API_KEY')
        if not notion_api_key:
            error_msg = "NOTION_API_KEY environment variable is not set. Cannot authenticate with Notion."
            logging.error(error_msg)
            return error_msg

        # 1. Parse the command_content string into a Python dictionary
        # LangChain might pass it as a string, even if the LLM outputted a dict.
        try:
            payload_dict = json.loads(command_content)
        except json.JSONDecodeError as e:
            error_msg = f"Error: Failed to decode command_content as JSON: {e}. Content: {command_content[:500]}..."
            logging.error(error_msg)
            return error_msg

        # 2. Check for and replace environment variable placeholders
        parent_info = payload_dict.get('parent')
        if parent_info:
            if parent_info.get('page_id') == '${NOTION_PAGE_ID}':
                actual_notion_page_id = os.environ.get("NOTION_PAGE_ID")
                if not actual_notion_page_id:
                    error_msg = "Error: LLM requested a parent page via '${NOTION_PAGE_ID}', but NOTION_PAGE_ID environment variable is not set."
                    logging.error(error_msg)
                    return error_msg
                payload_dict['parent']['page_id'] = actual_notion_page_id
                logging.info(f"Replaced '${{NOTION_PAGE_ID}}' with actual page ID: {actual_notion_page_id}")

            elif parent_info.get('database_id') == '${NOTION_DATABASE_ID}':
                actual_notion_database_id = os.environ.get("NOTION_DATABASE_ID")
                if not actual_notion_database_id:
                    error_msg = "Error: LLM requested a parent database via '${NOTION_DATABASE_ID}', but NOTION_DATABASE_ID environment variable is not set."
                    logging.error(error_msg)
                    return error_msg
                payload_dict['parent']['database_id'] = actual_notion_database_id
                logging.info(f"Replaced '${{NOTION_DATABASE_ID}}' with actual database ID: {actual_notion_database_id}")

        headers = {
            'Authorization': f'Bearer {notion_api_key}',
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
        }
        url = 'https://api.notion.com/v1/pages'

        # 3. Make the API call using requests
        try:
            logging.info(f"Attempting to send Notion API request with final payload: {json.dumps(payload_dict, indent=2)}")
            response = requests.post(url, headers=headers, json=payload_dict)
            response.raise_for_status() # This will raise an HTTPError for 4xx/5xx responses

            response_json = response.json()
            page_id = response_json.get('id')
            page_url = response_json.get('url')

            success_message = f"Successfully created Notion page! Page ID: {page_id}, URL: {page_url}"
            logging.info(success_message)
            return success_message

        except requests.exceptions.HTTPError as http_err:
            # Specific error for HTTP status codes
            error_msg = f"Notion API HTTP error: {http_err}. Status Code: {response.status_code}. Response: {response.text}"
            logging.error(error_msg)
            return error_msg
        except requests.exceptions.ConnectionError as conn_err:
            error_msg = f"Connection error: {conn_err}. Check internet connection or Notion API status."
            logging.error(error_msg)
            return error_msg
        except requests.exceptions.Timeout as timeout_err:
            error_msg = f"Request timed out: {timeout_err}. Notion API might be slow or unreachable."
            logging.error(error_msg)
            return error_msg
        except requests.exceptions.RequestException as req_err:
            error_msg = f"An unexpected request error occurred: {req_err}"
            logging.error(error_msg)
            return error_msg
        except Exception as e:
            error_msg = f"An unhandled error occurred in Notion API call: {e}"
            logging.error(error_msg)
            return error_msg
    
    def run(self, text_context: str, user_query: str) -> str:
        """
        Run the notion page creation agent with text context and user query.
        
        Args:
            text_context: The aggregated text content to be used for page creation
            user_query: The user's specific request for the page
            
        Returns:
            The agent's response as a string
        """
        # Combine context and query for the agent
        combined_input = f"""
        Text Context: {text_context}
        
        User Query: {user_query}
        
        Please create a Notion page based on the above context and user request.
        """
        
        response = ""
        for step in self.agent.stream(
            {"messages": combined_input},
            stream_mode="values",
        ):
            response = step["messages"][-1].content
        
        return response
    
    def run_streaming(self, text_context: str, user_query: str):
        """
        Run the notion page creation agent with streaming output.
        
        Args:
            text_context: The aggregated text content to be used for page creation
            user_query: The user's specific request for the page
            
        Yields:
            Each step of the agent's response
        """
        combined_input = f"""
        Text Context: {text_context}
        
        User Query: {user_query}
        
        Please create a Notion page based on the above context and user request.
        """
        
        for step in self.agent.stream(
            {"messages": combined_input},
            stream_mode="values",
        ):
            yield step["messages"][-1]