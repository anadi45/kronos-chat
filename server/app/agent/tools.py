from typing import Annotated
from langchain_core.tools import tool

@tool
def add(a: Annotated[int, "first number"], b: Annotated[int, "second number"]) -> Annotated[int, "sum of a and b"]:
    """Add two numbers together."""
    return a + b