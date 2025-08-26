import os
from typing import AsyncGenerator
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.graph import StateGraph, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from .tools import add

# Load environment variables
load_dotenv()

class Agent:
    def __init__(self):
        # Mock LLM for now - no Gemini dependency
        self.llm = None
        self.llm_with_tools = None
        
        # Create the graph
        self.graph = self._create_graph()
    
    def _create_graph(self):
        # Define the graph
        workflow = StateGraph(MessagesState)
        
        # Define the nodes
        workflow.add_node("agent", self._call_model)
        workflow.add_node("tools", ToolNode([add]))
        
        # Set the entrypoint
        workflow.set_entry_point("agent")
        
        # Add conditional edges
        workflow.add_conditional_edges(
            "agent",
            tools_condition,
        )
        workflow.add_edge("tools", "agent")
        
        # Compile the graph
        return workflow.compile()
    
    def _call_model(self, state: MessagesState):
        # Mock model response - no actual LLM call
        messages = state['messages']
        if messages:
            last_message = messages[-1]
            if isinstance(last_message, HumanMessage):
                response = AIMessage(content=f"Mock response to: {last_message.content}. This is a placeholder until AI functionality is implemented.")
            else:
                response = AIMessage(content="Mock AI response. This is a placeholder until AI functionality is implemented.")
        else:
            response = AIMessage(content="Hello! This is a mock AI agent response.")
        
        return {"messages": [response]}
    
    async def astream(self, messages):
        """Stream responses from the agent."""
        # Mock streaming response
        mock_response = "This is a mock streaming response from the AI agent. AI functionality will be implemented soon."
        
        # Simulate streaming by yielding chunks
        words = mock_response.split()
        for word in words:
            yield {
                "agent": {
                    "messages": [AIMessage(content=word + " ")]
                }
            }
        
        # Final completion message
        yield {
            "agent": {
                "messages": [AIMessage(content="[STREAMING_COMPLETE]")]
            }
        }

# Global agent instance
agent = Agent()