from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_livestock():
    return {"message": "Livestock API is under development"}
