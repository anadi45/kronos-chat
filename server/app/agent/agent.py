import os
from typing import Annotated
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, StateGraph, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from .tools import add

# Load environment variables
load_dotenv()

class Agent:
    def __init__(self):
        # Initialize the LLM with Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash-latest",
            google_api_key=api_key,
            temperature=0
        )
        
        # Bind the tools to the LLM
        self.llm_with_tools = self.llm.bind_tools([add])
        
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
        
        # Add edges
        workflow.add_conditional_edges(
            "agent",
            tools_condition,
        )
        workflow.add_edge("tools", "agent")
        
        # Compile the graph
        return workflow.compile()
    
    def _call_model(self, state: MessagesState):
        messages = state['messages']
        response = self.llm_with_tools.invoke(messages)
        return {"messages": [response]}
    
    def invoke(self, message: str):
        """Invoke the agent with a message."""
        messages = [HumanMessage(content=message)]
        result = self.graph.invoke({"messages": messages})
        return result['messages'][-1].content if result['messages'] else ""