from fastapi import APIRouter, HTTPException
from typing import List

router = APIRouter()

@router.get("/")
async def get_chats():
    return {"message": "Chat endpoint"}

@router.get("/{chat_id}")
async def get_chat(chat_id: int):
    return {"chat_id": chat_id, "message": f"Details for chat {chat_id}"}