from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_users():
    return {"message": "Users endpoint"}

@router.get("/{user_id}")
async def get_user(user_id: int):
    return {"user_id": user_id, "message": f"Details for user {user_id}"}